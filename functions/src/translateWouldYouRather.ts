import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore } from "firebase-admin/firestore";

const openaiKey = defineSecret("OPENAI_API_KEY");

type RussianTranslation = {
  a: string;
  b: string;
  explanation: string;
};

function validTranslation(value: unknown): value is RussianTranslation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.a === "string" && v.a.trim().length > 0 &&
    typeof v.b === "string" && v.b.trim().length > 0 &&
    typeof v.explanation === "string" && v.explanation.trim().length > 0
  );
}

export const translateWouldYouRather = onCall(
  {
    secrets: [openaiKey],
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 1,
    cors: true,
  },
  async (request) => {
    const questionId = request.data?.questionId;

    if (
      typeof questionId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,150}$/.test(questionId)
    ) {
      throw new HttpsError("invalid-argument", "Invalid question ID.");
    }

    const db = getFirestore();
    const ref = db.collection("wouldYouRatherQuestions").doc(questionId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      throw new HttpsError("not-found", "Question not found.");
    }

    const question = snapshot.data()!;

    if (validTranslation(question.ru)) {
      return { ru: question.ru };
    }

    if (
      typeof question.a !== "string" ||
      typeof question.b !== "string" ||
      typeof question.explanation !== "string"
    ) {
      throw new HttpsError("failed-precondition", "Invalid question data.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey.value()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Translate the supplied Would You Rather game choices and explanation " +
              "from English into natural, conversational Russian. " +
              "Preserve the exact meaning, humor, flirtation, and tone. " +
              "Do not invent new choices. " +
              "Return only a JSON object with string keys a, b, explanation.",
          },
          {
            role: "user",
            content: JSON.stringify({
              a: question.a,
              b: question.b,
              explanation: question.explanation,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new HttpsError("internal", "Translation service unavailable.");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      throw new HttpsError("internal", "Translation response missing.");
    }

    let ru: unknown;

    try {
      ru = JSON.parse(content);
    } catch {
      throw new HttpsError("internal", "Invalid translation response.");
    }

    if (!validTranslation(ru)) {
      throw new HttpsError("internal", "Incomplete translation.");
    }

    // If another request already saved a translation, preserve that one.
    const finalRu = await db.runTransaction(async (tx) => {
      const latest = await tx.get(ref);
      if (!latest.exists) {
        throw new HttpsError("not-found", "Question no longer exists.");
      }

      const existing = latest.data()?.ru;
      if (validTranslation(existing)) return existing;

      tx.update(ref, { ru });
      return ru as RussianTranslation;
    });

    return { ru: finalRu };
  }
);