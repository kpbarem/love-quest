import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";
import "./WouldYouRather.css";

const categories = [
  { id: "random", label: "Random mix", emoji: "🎲" },
  { id: "funny", label: "Funny & absurd", emoji: "😂" },
  { id: "deep", label: "Deep/philosophical", emoji: "🧠" },
  { id: "romantic", label: "Romantic", emoji: "❤️" },
  { id: "spooky", label: "Spooky", emoji: "👻" },
  { id: "impossible", label: "Impossible choices", emoji: "⚖️" },
  { id: "flirty", label: "Flirty", emoji: "🔥" },
] as const;

type Category = (typeof categories)[number]["id"];
type SpecificCategory = Exclude<Category, "random">;
type Choice = "A" | "B";
type Question = {
  id: string;
  category: SpecificCategory;
  a: string;
  b: string;
  predictedA: number;
  explanation: string;
};
type GenerationResult = { questions: Question[]; count: number };

const specificCategories: SpecificCategory[] = [
  "funny", "deep", "romantic", "spooky", "impossible", "flirty",
];
const SEEN_KEY = "lovequest-wyr-seen-v1";
const FAVORITES_KEY = "lovequest-wyr-favorites";

function readIds(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function shuffle<T,>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isQuestion(id: string, data: Record<string, unknown>): data is Record<string, unknown> & Omit<Question, "id"> {
  return id.length > 0 &&
    specificCategories.includes(data.category as SpecificCategory) &&
    typeof data.a === "string" && typeof data.b === "string" &&
    typeof data.explanation === "string" &&
    typeof data.predictedA === "number" &&
    Number.isFinite(data.predictedA) && data.predictedA >= 0 && data.predictedA <= 100;
}

async function fetchQuestions(category: Category): Promise<Question[]> {
  const ref = collection(db, "wouldYouRatherQuestions");
  const q = category === "random"
    ? query(ref, limit(500))
    : query(ref, where("category", "==", category), limit(200));
  const snapshot = await getDocs(q);
  return snapshot.docs.flatMap(doc => {
    const data = doc.data();
    return isQuestion(doc.id, data) ? [{
      id: doc.id,
      category: data.category,
      a: data.a,
      b: data.b,
      predictedA: data.predictedA,
      explanation: data.explanation,
    }] : [];
  });
}

const generate = httpsCallable<{ category: SpecificCategory }, GenerationResult>(
  functions, "generateWouldYouRather", { timeout: 120000 }
);

export default function WouldYouRather() {
  const [category, setCategory] = useState<Category>("random");
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Choice | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(() => readIds(FAVORITES_KEY));
  const seenRef = useRef<Set<string>>(new Set(readIds(SEEN_KEY)));
  const generatingRef = useRef(false);
  const attemptedRef = useRef<Set<SpecificCategory>>(new Set());

  const generateFor = useCallback(async (target: SpecificCategory): Promise<boolean> => {
    if (generatingRef.current || attemptedRef.current.has(target)) return false;
    generatingRef.current = true;
    attemptedRef.current.add(target);
    setGenerating(true);
    try {
      await generate({ category: target });
      return true;
    } catch (e) {
      console.error("Question generation failed", e);
      return false;
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      setQueue([]);
      setIndex(0);
      setAnswer(null);
      setRevealed(false);
      try {
        let all = await fetchQuestions(category);
        let unseen = shuffle(all.filter(q => !seenRef.current.has(q.id)));
        if (!cancelled && unseen.length === 0) {
          const target = category === "random"
            ? specificCategories.find(c => !attemptedRef.current.has(c))
            : category;
          if (target) {
            const generated = await generateFor(target);
            if (generated) {
              all = await fetchQuestions(category);
              unseen = shuffle(all.filter(q => !seenRef.current.has(q.id)));
            }
          }
        }
        if (!cancelled) {
          setQueue(unseen);
          if (unseen.length === 0) {
            setError(all.length ? "You've seen every available question in this category. Try another category or come back later." : "No questions available yet. Generation may be cooling down; please try again later.");
          }
        }
      } catch (e) {
        console.error("Could not load questions", e);
        if (!cancelled) setError("Couldn't load questions from Firestore. Check the database rules and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [category, reload, generateFor]);

  const question = queue[index];
  const selectedCategory = categories.find(c => c.id === category)!;
  const isFavorite = question ? favorites.includes(question.id) : false;

  useEffect(() => {
    if (!question || seenRef.current.has(question.id)) return;
    seenRef.current.add(question.id);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seenRef.current]));
  }, [question]);

  function changeCategory(next: Category) {
    if (next === category) return;
    setCategory(next);
  }

  function nextQuestion() {
    setAnswer(null);
    setRevealed(false);
    if (index + 1 < queue.length) setIndex(i => i + 1);
    else setReload(n => n + 1);
  }

  function toggleFavorite() {
    if (!question) return;
    const next = isFavorite
      ? favorites.filter(id => id !== question.id)
      : [...favorites, question.id];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }

  return (
    <main className="wyr-page">
      <div className="wyr-shell">
        <header className="wyr-header">
          <Link to="/" className="wyr-home">← LOVE QUEST</Link>
          <span className="wyr-brand">🦇 KEVANDRA</span>
        </header>
        <section className="wyr-intro">
          <h1>WOULD YOU RATHER?</h1>
          <p>Choose your fate. Defend your answer. Repeat forever. ❤️</p>
        </section>
        <section className="wyr-categories" aria-label="Question categories">
          {categories.map(c => (
            <button type="button" key={c.id}
              className={`wyr-category ${category === c.id ? "active" : ""}`}
              onClick={() => changeCategory(c.id)} aria-pressed={category === c.id}>
              {c.emoji} {c.label}
            </button>
          ))}
        </section>
        {question ? (
          <section className="wyr-card" key={question.id}>
            <div className="wyr-card-top">
              <span>{selectedCategory.emoji} {selectedCategory.label}</span>
              <button type="button" className="wyr-favorite" onClick={toggleFavorite}
                aria-label={isFavorite ? "Remove favorite" : "Save favorite"}>
                {isFavorite ? "❤️ Saved" : "♡ Save"}
              </button>
            </div>
            <h2>Would you rather...</h2>
            <div className="wyr-options">
              {(["A", "B"] as const).map(choice => (
                <button type="button" key={choice}
                  className={`wyr-option ${answer === choice ? "selected" : ""}`}
                  onClick={() => { setAnswer(choice); setRevealed(false); }}
                  aria-pressed={answer === choice}>
                  <span className="wyr-option-letter">{choice}</span>
                  <span>{choice === "A" ? question.a : question.b}</span>
                </button>
              ))}
            </div>
            {revealed ? (
              <div className="wyr-results">
                <h3>🔮 The AI predicts...</h3>
                <p className="wyr-disclaimer">Illustrative estimates, not real survey results.</p>
                {(["A", "B"] as const).map(choice => {
                  const percent = choice === "A" ? question.predictedA : 100 - question.predictedA;
                  return (
                    <div className="wyr-result" key={choice}>
                      <div className="wyr-result-label"><span>Option {choice}</span><strong>{percent}%</strong></div>
                      <div className="wyr-bar"><div
                        className={`wyr-bar-fill option-${choice.toLowerCase()}`}
                        style={{ width: `${percent}%` }} /></div>
                    </div>
                  );
                })}
                <p className="wyr-explanation">💭 {question.explanation}</p>
              </div>
            ) : (
              <button type="button" className="wyr-reveal" disabled={!answer}
                onClick={() => setRevealed(true)}>🔮 Reveal AI Predictions</button>
            )}
            <button type="button" className="wyr-next" onClick={nextQuestion}>Next Question →</button>
          </section>
        ) : (
          <section className="wyr-card wyr-empty" aria-live="polite">
            <h2>{loading ? "Loading questions... 🦇" : "All questions explored! 🦇"}</h2>
            <p>{loading ? "Checking our shared question library..." : error}</p>
            {!loading && <button type="button" className="wyr-next"
              onClick={() => { attemptedRef.current.clear(); setReload(n => n + 1); }}>
              Try Again
            </button>}
          </section>
        )}
        {generating && <p className="wyr-footer">✨ Creating fresh questions with AI...</p>}
      </div>
    </main>
  );
}
