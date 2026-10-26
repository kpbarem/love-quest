
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";

const openaiKey = defineSecret("OPENAI_API_KEY");
// const db = getFirestore();

const CATEGORIES = [
    "funny",
    "deep",
    "romantic",
    "spooky",
    "impossible",
    "flirty",
] as const;

type Category = typeof CATEGORIES[number];

const GENERATION_COOLDOWN_MS = 10 * 60 * 1000;
const MAX_GENERATION_ATTEMPTS_PER_DAY = 30;

type GeneratedQuestion = {
    a: string;
    b: string;
    predictedA: number;
    explanation: string;
};

function isCategory(value: unknown): value is Category {
    return CATEGORIES.some((category) => category === value);
}

function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

export const generateWouldYouRather = onCall(
    {
        secrets: [openaiKey],
        timeoutSeconds: 120,
        memory: "512MiB",
        maxInstances: 1,
        cors: true,
    },
    async (request) => {
        const db = getFirestore();
        const category: unknown = request.data?.category;

        if (!isCategory(category)) {
            throw new HttpsError(
                "invalid-argument",
                "Invalid question category."
            );
        }

        const quotaRef = db
            .collection("wouldYouRatherGenerationControl")
            .doc(category);

        const now = Date.now();
        const day = new Date(now).toISOString().slice(0, 10);

        const permitted = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(quotaRef);
            const data = snapshot.data();

            const attemptsToday =
                data?.day === day ? Number(data.attemptsToday ?? 0) : 0;

            const lastAttemptAt = Number(data?.lastAttemptAt ?? 0);

            if (
                attemptsToday >= MAX_GENERATION_ATTEMPTS_PER_DAY ||
                now - lastAttemptAt < GENERATION_COOLDOWN_MS
            ) {
                return false;
            }

            transaction.set(quotaRef, {
                day,
                attemptsToday: attemptsToday + 1,
                lastAttemptAt: now,
            });

            return true;
        });

        if (!permitted) {
            throw new HttpsError(
                "resource-exhausted",
                "Question generation is cooling down. Please try again later."
            );
        }


        const collection = db.collection("wouldYouRatherQuestions");

        const existingSnapshot = await collection
            .where("category", "==", category)
            .limit(200)
            .get();

        const existing = existingSnapshot.docs.map(doc => {
            const data = doc.data();
            return `${data.a} OR ${data.b}`;
        });

        const client = new OpenAI({
            apiKey: openaiKey.value(),
        });

        const response = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            temperature: 0.9,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `
You create imaginative, interesting Would You Rather
questions for two adults who enjoy discussing their answers.

Return JSON:
{
  "questions": [
    {
      "a": "First choice",
      "b": "Second choice",
      "predictedA": 50,
      "explanation": "Brief reasoning"
    }
  ]
}

Generate exactly 20 questions.

CATEGORY: ${category}

Category definitions:
funny = hilarious, absurd, unexpected
deep = philosophical, ethical, existential
romantic = love, relationships, affection
spooky = supernatural, Halloween, mysterious
impossible = extremely difficult tradeoffs
flirty = playful, teasing, sexy, affectionate adult romance

Requirements:
- Both options should be genuinely compelling.
- Avoid boring, obvious, or repetitive choices.
- Encourage interesting conversations.
- Vary subjects, situations, and emotional intensity.
- Keep each option concise.
- Do not repeat or lightly reword previous questions.
- No real-world polling claims.
- predictedA must be an integer from 15 to 85.
- Predictions are speculative thought experiments.
- Do not invent survey findings.
- Avoid demographic stereotypes.
- Explain the estimated preference in 1–2 sentences.
          `,
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        existingQuestions: existing,
                    }),
                },
            ],
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new HttpsError(
                "internal",
                "AI returned no content."
            );
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(content);
        } catch {
            throw new HttpsError(
                "internal",
                "Invalid AI response."
            );
        }

        const result = parsed as { questions?: unknown };

        if (!Array.isArray(result?.questions)) {
            throw new HttpsError(
                "internal",
                "Invalid question format."
            );
        }

        const existingKeys = new Set<string>();

        for (const doc of existingSnapshot.docs) {
            const data = doc.data();

            if (typeof data.a === "string" && typeof data.b === "string") {
                existingKeys.add(normalize(`${data.a} OR ${data.b}`));
                existingKeys.add(normalize(`${data.b} OR ${data.a}`));
            }
        }
        const generatedKeys = new Set<string>();

        const valid: GeneratedQuestion[] = [];

        for (const candidate of result.questions) {
            if (!candidate || typeof candidate !== "object") continue;

            const q = candidate as Record<string, unknown>;

            if (
                typeof q.a !== "string" ||
                typeof q.b !== "string" ||
                typeof q.explanation !== "string" ||
                typeof q.predictedA !== "number" ||
                !Number.isInteger(q.predictedA) ||
                q.predictedA < 15 ||
                q.predictedA > 85
            ) {
                continue;
            }

            const a = q.a.trim();
            const b = q.b.trim();
            const explanation = q.explanation.trim();

            if (
                a.length < 10 || a.length > 250 ||
                b.length < 10 || b.length > 250 ||
                explanation.length < 10 || explanation.length > 500 ||
                normalize(a) === normalize(b)
            ) {
                continue;
            }

            const key = normalize(`${a} OR ${b}`);
            const reverseKey = normalize(`${b} OR ${a}`);

            if (
                existingKeys.has(key) ||
                existingKeys.has(reverseKey) ||
                generatedKeys.has(key) ||
                generatedKeys.has(reverseKey)
            ) {
                continue;
            }

            generatedKeys.add(key);

            valid.push({
                a,
                b,
                explanation,
                predictedA: q.predictedA,
            });
        }

        if (valid.length === 0) {
            throw new HttpsError(
                "internal",
                "No valid new questions generated."
            );
        }

        const batch = db.batch();

        const saved = valid.map(q => {
            const ref = collection.doc();

            const question = {
                id: ref.id,
                category,
                ...q,
                createdAt: FieldValue.serverTimestamp(),
            };

            batch.set(ref, question);

            return {
                id: ref.id,
                category,
                ...q,
            };
        });

        await batch.commit();

        return {
            questions: saved,
            count: saved.length,
        };
    }
);
