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




type Language = "en" | "ru";

const LANGUAGE_KEY = "lovequest-wyr-language";

const translations = {
    en: {
        title: "WOULD YOU RATHER?",
        subtitle: "Choose your answer. Defend your answer. Repeat forever. ❤️",
        question: "Would you rather...",
        save: "♡ Save",
        saved: "❤️ Saved",
        removeFavorite: "Remove favorite",
        saveFavorite: "Save favorite",
        predictionTitle: "🔮 The AI predicts...",
        disclaimer: "Illustrative estimates, not real survey results.",
        option: "Option",
        reveal: "🔮 Reveal AI Predictions",
        next: "Next Question →",
        loading: "Loading questions... 🦇",
        loadingDescription: "Checking our shared question library...",
        empty: "All questions explored! 🦇",
        retry: "Try Again",
        generating: "✨ Creating fresh questions with AI...",
        translating: "Translating into Russian...",
        translationError: "Russian translation unavailable. Showing English.",
        categories: {
            random: "Random mix",
            funny: "Funny & absurd",
            deep: "Deep/philosophical",
            romantic: "Romantic",
            spooky: "Spooky",
            impossible: "Impossible choices",
            flirty: "Flirty",
        },
    },
    ru: {
        title: "ЧТО БЫ ТЫ ВЫБРАЛА?",
        subtitle: "Выбирай, объясняй свой выбор и веселись! ❤️",
        question: "Что бы ты выбрала?",
        save: "♡ Сохранить",
        saved: "❤️ Сохранено",
        removeFavorite: "Убрать из избранного",
        saveFavorite: "Добавить в избранное",
        predictionTitle: "🔮 Прогноз ИИ...",
        disclaimer: "Примерные оценки ИИ, а не результаты реального опроса.",
        option: "Вариант",
        reveal: "🔮 Показать прогноз ИИ",
        next: "Следующий вопрос →",
        loading: "Загружаем вопросы... 🦇",
        loadingDescription: "Проверяем нашу коллекцию вопросов...",
        empty: "Все вопросы закончились! 🦇",
        retry: "Попробовать снова",
        generating: "✨ ИИ придумывает новые вопросы...",
        translating: "Переводим на русский...",
        translationError: "Перевод недоступен. Показываем английский текст.",
        categories: {
            random: "Случайные",
            funny: "Смешные и абсурдные",
            deep: "Глубокие и философские",
            romantic: "Романтика",
            spooky: "Жуткие",
            impossible: "Невозможный выбор",
            flirty: "Флирт",
        },
    },
} as const;



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
    ru?: {
        a: string;
        b: string;
        explanation: string;
    };
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

function isRussianTranslation(
    value: unknown
): value is { a: string; b: string; explanation: string } {
    if (!value || typeof value !== "object") return false;

    const data = value as Record<string, unknown>;

    return (
        typeof data.a === "string" &&
        typeof data.b === "string" &&
        typeof data.explanation === "string"
    );
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
            ru: isRussianTranslation(data.ru) ? data.ru : undefined,
        }] : [];
    });
}

const generate = httpsCallable<{ category: SpecificCategory }, GenerationResult>(
    functions, "generateWouldYouRather", { timeout: 120000 }
);

type Translation = {
    a: string;
    b: string;
    explanation: string;
};

const translateQuestion = httpsCallable<
    { questionId: string },
    { ru: Translation }
>(
    functions,
    "translateWouldYouRather",
    { timeout: 60000 }
);

export default function WouldYouRather() {
    const [category, setCategory] = useState<Category>("random");
    const [language, setLanguage] = useState<Language>(() => {
        try {
            return localStorage.getItem(LANGUAGE_KEY) === "ru" ? "ru" : "en";
        } catch {
            return "en";
        }
    });

    const t = translations[language];
    const [queue, setQueue] = useState<Question[]>([]);
    const [index, setIndex] = useState(0);
    const [answer, setAnswer] = useState<Choice | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);
    const [favorites, setFavorites] = useState<string[]>(() => readIds(FAVORITES_KEY));
    const [translation, setTranslation] = useState<Translation | null>(null);
    const [translating, setTranslating] = useState(false);
    const [translationError, setTranslationError] = useState(false);
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
        try {
            localStorage.setItem(LANGUAGE_KEY, language);
        } catch {
            // Storage may be unavailable.
        }
    }, [language]);

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
        let cancelled = false;

        setTranslation(null);
        setTranslationError(false);
        setTranslating(false);

        if (!question || language !== "ru" || question.ru) {
            return;
        }

        setTranslating(true);

        translateQuestion({ questionId: question.id })
            .then(({ data }) => {
                if (!cancelled) setTranslation(data.ru);
            })
            .catch((error) => {
                console.error("Translation failed", error);
                if (!cancelled) setTranslationError(true);
            })
            .finally(() => {
                if (!cancelled) setTranslating(false);
            });

        return () => {
            cancelled = true;
        };
    }, [question, language]);
    const ru = question?.ru ?? translation;

    const waitingForRussian =
        language === "ru" && !!question && !ru && !translationError;

    const displayedQuestion =
        language === "ru" && ru ? ru : question;

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
                    <div className="wyr-header-actions">
                        <span className="wyr-brand">🦇 KEVANDRA</span>

                        <div className="wyr-language-switch" aria-label="Language">
                            <button
                                type="button"
                                className={language === "en" ? "active" : ""}
                                onClick={() => setLanguage("en")}
                                aria-pressed={language === "en"}
                            >
                                EN
                            </button>

                            <button
                                type="button"
                                className={language === "ru" ? "active" : ""}
                                onClick={() => setLanguage("ru")}
                                aria-pressed={language === "ru"}
                            >
                                RU
                            </button>
                        </div>
                    </div>
                </header>
                <section className="wyr-intro">
                    <h1>{t.title}</h1>
                    <p>{t.subtitle}</p>
                </section>
                <section className="wyr-categories" aria-label="Question categories">
                    {categories.map(c => (
                        <button type="button" key={c.id}
                            className={`wyr-category ${category === c.id ? "active" : ""}`}
                            onClick={() => changeCategory(c.id)} aria-pressed={category === c.id}>
                            {c.emoji} {t.categories[c.id]}
                        </button>
                    ))}
                </section>
                {question ? (
                    <section className="wyr-card" key={question.id}>
                        <div className="wyr-card-top">
                            <span>{selectedCategory.emoji} {t.categories[selectedCategory.id]}</span>
                            <button type="button" className="wyr-favorite" onClick={toggleFavorite}
                                aria-label={isFavorite ? t.removeFavorite : t.saveFavorite}>
                                {isFavorite ? t.saved : t.save}
                            </button>
                        </div>
                        <h2>{t.question}</h2>
                        {language === "ru" && translating && (
                            <p className="wyr-translation-status">{t.translating}</p>
                        )}

                        {language === "ru" && translationError && !ru && (
                            <p className="wyr-translation-status">{t.translationError}</p>
                        )}
                        {waitingForRussian ? (
                            <div className="wyr-translation-loading" aria-live="polite">
                                <span className="wyr-translation-spinner" />
                                <p>Переводим вопрос на русский... 🇷🇺</p>
                            </div>
                        ) : (
                            <div className="wyr-options">
                                {(["A", "B"] as const).map(choice => (
                                    <button type="button" key={choice}
                                        className={`wyr-option ${answer === choice ? "selected" : ""}`}
                                        onClick={() => { setAnswer(choice); setRevealed(false); }}
                                        disabled={language === "ru" && translating}
                                        aria-pressed={answer === choice}>
                                        <span className="wyr-option-letter">{choice}</span>
                                        <span>
                                            {choice === "A" ? displayedQuestion?.a : displayedQuestion?.b}
                                        </span>˝
                                    </button>
                                ))}
                            </div>
                        )}
                        {revealed ? (
                            <div className="wyr-results">
                                <h3>{t.predictionTitle}</h3>
                                <p className="wyr-disclaimer">{t.disclaimer}.</p>
                                {(["A", "B"] as const).map(choice => {
                                    const percent = choice === "A" ? question.predictedA : 100 - question.predictedA;
                                    return (
                                        <div className="wyr-result" key={choice}>
                                            <div className="wyr-result-label"><span>{t.option} {choice}</span><strong>{percent}%</strong></div>
                                            <div className="wyr-bar"><div
                                                className={`wyr-bar-fill option-${choice.toLowerCase()}`}
                                                style={{ width: `${percent}%` }} /></div>
                                        </div>
                                    );
                                })}
                                <p className="wyr-explanation">
                                    💭 {displayedQuestion?.explanation}
                                </p>
                            </div>
                        ) : (
                            <button type="button" className="wyr-reveal" disabled={!answer}
                                onClick={() => setRevealed(true)}>{t.reveal}</button>
                        )}
                        <button type="button" className="wyr-next" onClick={nextQuestion}>{t.next}</button>
                    </section>
                ) : (
                    <section className="wyr-card wyr-empty" aria-live="polite">
                        <h2>{loading ? t.loading : t.empty}</h2>
                        <p>{loading ? t.loadingDescription : error}</p>
                        {!loading && <button type="button" className="wyr-next"
                            onClick={() => { attemptedRef.current.clear(); setReload(n => n + 1); }}>
                            {t.retry}
                        </button>}
                    </section>
                )}
                {generating && <p className="wyr-footer">{t.generating}</p>}
            </div>
        </main>
    );
}
