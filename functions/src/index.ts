import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();

const telegramBotToken =
  defineSecret("TELEGRAM_BOT_TOKEN");

const kevinChatId =
  defineSecret("KEVIN_TELEGRAM_CHAT_ID");

const telegramWebhookSecret =
  defineSecret("TELEGRAM_WEBHOOK_SECRET");

const VALID_KEVS = [
  "cool",
  "sexy",
  "dental",
  "jokey",
  "musical",
  "regular",
];

const VALID_ACTIVITIES = [
  "cuddle",
  "movie",
  "coffee",
  "walk",
  "dinner",
  "game",
  "adventure",
  "nothing",
];

const VALID_EXTRAS = [
  "kisses",
  "forehead-kisses",
  "cuddles",
  "tea",
  "flowers",
  "joke",
  "spiderman",
];

const kevNames: Record<string, string> = {
  cool: "😎 Cool Kev",
  sexy: "🔥 Sexy Kev",
  dental: "🦷 Dental Kev",
  jokey: "😂 Jokey Kev",
  musical: "🎸 musical Kev",
  regular: "❤️ Regular Kev",
};

const activityNames: Record<string, string> = {
  cuddle: "🫂 Cuddle",
  movie: "🍿 Movie Night",
  coffee: "☕ Coffee Date",
  walk: "🌲 Walk Somewhere Pretty",
  dinner: "🍝 Dinner Together",
  game: "🎮 Play Something",
  adventure: "🗺️ Go Somewhere New",
  nothing: "❤️ Absolutely Nothing Together",
};

const extraNames: Record<string, string> = {
  kisses: "💋 Unlimited Kisses",
  "forehead-kisses": "😘 Forehead Kisses",
  cuddles: "🫂 Extra Cuddles",
  tea: "🫖 Tea",
  flowers: "💐 Flowers",
  joke: "😂 Terrible Joke",
  spiderman: "🕷️ Spider-Man Costume",
};

type TelegramInlineButton = {
  text: string;
  callback_data: string;
};

async function telegramApi(
  token: string,
  method: string,
  body: unknown
) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      `Telegram ${method} failed`,
      response.status,
      errorText
    );

    throw new Error(
      `Telegram API returned ${response.status}`
    );
  }

  return response.json();
}

async function sendTelegramMessage({
  token,
  chatId,
  text,
  buttons,
}: {
  token: string;
  chatId: string;
  text: string;
  buttons?: TelegramInlineButton[][];
}) {
  return telegramApi(token, "sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: buttons
      ? {
          inline_keyboard: buttons,
        }
      : undefined,
  });
}

function validateOrder(data: any) {
  if (!VALID_KEVS.includes(data?.kevType)) {
    throw new HttpsError(
      "invalid-argument",
      "Unknown Kev type."
    );
  }

  if (!VALID_ACTIVITIES.includes(data?.activity)) {
    throw new HttpsError(
      "invalid-argument",
      "Unknown activity."
    );
  }

  if (!Array.isArray(data?.extras)) {
    throw new HttpsError(
      "invalid-argument",
      "Extras must be an array."
    );
  }

  if (
    data.extras.some(
      (extra: unknown) =>
        typeof extra !== "string" ||
        !VALID_EXTRAS.includes(extra)
    )
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Unknown extra."
    );
  }

  if (
    typeof data?.specialInstructions !== "string"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid instructions."
    );
  }

  if (data.specialInstructions.length > 300) {
    throw new HttpsError(
      "invalid-argument",
      "Instructions are too long."
    );
  }
}

export const createKevOrder = onCall(
  {
    secrets: [
      telegramBotToken,
      kevinChatId,
    ],
  },
  async (request) => {
    validateOrder(request.data);

    const {
      kevType,
      activity,
      extras,
      specialInstructions,
    } = request.data;

    const orderRef =
      db.collection("kevOrders").doc();

    await orderRef.set({
      kevType,
      activity,
      extras,
      specialInstructions:
        specialInstructions.trim(),
      status: "requested",
      createdAt: FieldValue.serverTimestamp(),
    });

    const extrasText =
      extras.length > 0
        ? extras
            .map(
              (extra: string) =>
                `• ${extraNames[extra]}`
            )
            .join("\n")
        : "• Standard Kev package";

    const instructionsText =
      specialInstructions.trim().length > 0
        ? specialInstructions.trim()
        : "None";

    const message = [
      "🚨 NEW KEV ORDER",
      "",
      "Customer: Alexandra ❤️",
      "",
      `PRODUCT`,
      kevNames[kevType],
      "",
      "ACTIVITY",
      activityNames[activity],
      "",
      "EXTRAS",
      extrasText,
      "",
      "SPECIAL INSTRUCTIONS",
      `"${instructionsText}"`,
      "",
      `Order #${orderRef.id
        .slice(0, 8)
        .toUpperCase()}`,
    ].join("\n");

    try {
      const telegramResult: any =
        await sendTelegramMessage({
          token: telegramBotToken.value(),
          chatId: kevinChatId.value(),
          text: message,
          buttons: [
            [
              {
                text: "❤️ ACCEPT ORDER",
                callback_data:
                  `accept:${orderRef.id}`,
              },
            ],
            [
              {
                text: "🚗 EN ROUTE",
                callback_data:
                  `enroute:${orderRef.id}`,
              },
              {
                text: "💋 DELIVERED",
                callback_data:
                  `delivered:${orderRef.id}`,
              },
            ],
            [
              {
                text: "😭 UNAVAILABLE",
                callback_data:
                  `decline:${orderRef.id}`,
              },
            ],
          ],
        });

      await orderRef.update({
        status: "notified",
        notifiedAt:
          FieldValue.serverTimestamp(),
        telegramMessageId:
          telegramResult?.result?.message_id ??
          null,
      });
    } catch (error) {
      console.error(
        "Telegram notification failed",
        error
      );

      // Keep the Firestore order so it isn't lost.
      throw new HttpsError(
        "internal",
        "Order saved, but Kev notification failed."
      );
    }

    return {
      orderId: orderRef.id,
    };
  }
);

type TelegramUpdate = {
  callback_query?: {
    id: string;
    from?: {
      id?: number;
    };
    data?: string;
    message?: {
      chat?: {
        id?: number;
      };
      message_id?: number;
    };
  };
};

export const telegramWebhook = onRequest(
  {
    secrets: [
      telegramBotToken,
      kevinChatId,
      telegramWebhookSecret,
    ],
  },
  async (request, response) => {
    if (request.method !== "POST") {
      response
        .status(405)
        .send("Method not allowed");
      return;
    }

    const suppliedSecret =
      request.header(
        "X-Telegram-Bot-Api-Secret-Token"
      );

    if (
      suppliedSecret !==
      telegramWebhookSecret.value()
    ) {
      console.warn(
        "Rejected Telegram webhook request."
      );

      response.status(403).send("Forbidden");
      return;
    }

    const update =
      request.body as TelegramUpdate;

    const callback =
      update.callback_query;

    if (!callback?.data) {
      response.status(200).send("OK");
      return;
    }

    const callbackChatId =
      callback.message?.chat?.id;

    if (
      String(callbackChatId) !==
      String(kevinChatId.value())
    ) {
      console.warn(
        "Non-Kevin user attempted order action"
      );

      response.status(200).send("Ignored");
      return;
    }

    const separatorIndex =
      callback.data.indexOf(":");

    if (separatorIndex === -1) {
      response.status(200).send("Ignored");
      return;
    }

    const action =
      callback.data.slice(
        0,
        separatorIndex
      );

    const orderId =
      callback.data.slice(
        separatorIndex + 1
      );

    const orderRef =
      db.collection("kevOrders").doc(orderId);

    const snapshot =
      await orderRef.get();

    if (!snapshot.exists) {
      await answerCallback(
        telegramBotToken.value(),
        callback.id,
        "That Kev order no longer exists."
      );

      response.status(200).send("OK");
      return;
    }

    if (action === "accept") {
      await orderRef.update({
        status: "accepted",
        acceptedAt:
          FieldValue.serverTimestamp(),
      });

      await answerCallback(
        telegramBotToken.value(),
        callback.id,
        "Kev accepted the order ❤️"
      );
    } else if (action === "enroute") {
      await orderRef.update({
        status: "en_route",
        enRouteAt:
          FieldValue.serverTimestamp(),
      });

      await answerCallback(
        telegramBotToken.value(),
        callback.id,
        "Kev is officially en route 🚗"
      );
    } else if (action === "delivered") {
      await orderRef.update({
        status: "delivered",
        deliveredAt:
          FieldValue.serverTimestamp(),
      });

      await answerCallback(
        telegramBotToken.value(),
        callback.id,
        "Kev delivered 💋"
      );
    } else if (action === "decline") {
      await orderRef.update({
        status: "declined",
        declinedAt:
          FieldValue.serverTimestamp(),
      });

      await answerCallback(
        telegramBotToken.value(),
        callback.id,
        "Kev marked unavailable 😭"
      );
    }

    response.status(200).send("OK");
  }
);

async function answerCallback(
  token: string,
  callbackQueryId: string,
  text: string
) {
  await telegramApi(
    token,
    "answerCallbackQuery",
    {
      callback_query_id:
        callbackQueryId,
      text,
    }
  );
}