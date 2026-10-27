import { useState } from "react";
import { Link } from "react-router-dom";
import "./Wavelength.css";
import {
    waveSpectrums,
    type WaveLanguage,
} from "./wavelengthTranslations";

type Player = "Kevin" | "Alexandra";
type Phase = "clue" | "guess" | "reveal";

// type Spectrum = {
//     left: string;
//     right: string;
// };

// const spectrums: Spectrum[] = [
//     { left: "Terrible", right: "Wonderful" },
//     { left: "Completely normal", right: "Extremely weird" },
//     { left: "Romantic", right: "Not romantic at all" },
//     { left: "Harmless", right: "Dangerous" },
//     { left: "Boring", right: "Exciting" },
//     { left: "Underrated", right: "Overrated" },
//     { left: "Easy", right: "Difficult" },
//     { left: "Cute", right: "Terrifying" },
//     { left: "Cheap", right: "Expensive" },
//     { left: "Old-fashioned", right: "Futuristic" },
//     { left: "Realistic", right: "Impossible" },
//     { left: "Relaxing", right: "Stressful" },
//     { left: "Sweet", right: "Spicy" },
//     { left: "Ordinary", right: "Magical" },
//     { left: "Innocent", right: "Mischievous" },
//     { left: "Bad date idea", right: "Amazing date idea" },
//     { left: "Unromantic", right: "Very romantic" },
//     { left: "Forgettable", right: "Unforgettable" },
//     { left: "Awkward", right: "Charming" },
//     { left: "Very human", right: "Very alien" },
// ];

function randomTarget() {
    return Math.floor(Math.random() * 81) + 10;
}

// function randomSpectrum(previous?: Spectrum): Spectrum {
//     const choices = spectrums.filter(s => s !== previous);
//     return choices[Math.floor(Math.random() * choices.length)];
// }

function randomSpectrumIndex(previous?: number): number {
    if (previous === undefined) {
        return Math.floor(Math.random() * waveSpectrums.length);
    }

    const next = Math.floor(Math.random() * (waveSpectrums.length - 1));
    return next >= previous ? next + 1 : next;
}


function calculateScore(guess: number, target: number) {
    const distance = Math.abs(guess - target);

    if (distance <= 5) return 4;
    if (distance <= 12) return 3;
    if (distance <= 20) return 2;
    if (distance <= 30) return 1;
    return 0;
}



const localWaveText = {
    en: {
        back: "← KEVANDRA ARCADE",
        eyebrow: "HOW WELL DO OUR MINDS ALIGN?",
        subtitle: "Give a clue. Find if we are on the same wave ❤️",
        round: "ROUND",
        playOnline: "❤️ Play Together Online →",
        givingClue: (name: string) => `🎭 ${name}, you're giving the clue!`,
        makingGuess: (name: string) => `🎯 ${name}, make your guess!`,
        resultsIn: "✨ The results are in!",
        secretTarget: "Secret target",
        clueInstructions:
            "Think of something that belongs at this position between the two extremes.",
        yourClue: "Your clue",
        cluePlaceholder: "Example: A cup of warm tea",
        hideTarget: (name: string) => `Hide Target & Pass to ${name} →`,
        playersClue: (name: string) => `${name}'s clue`,
        guessInstructions:
            "Where do you think this belongs on the spectrum?",
        guessAriaLabel: "Your guess on the spectrum",
        reveal: "Reveal Our Wavelength ✨",
        perfect: "🎯 Perfect connection!",
        close: "❤️ Pretty close!",
        different: "😂 Different wavelengths!",
        targetLabel: "SECRET TARGET",
        guessLabel: "YOUR GUESS",
        pointsLabel: "POINTS",
        nextRound: "Next Round →",
        footer: "Two minds. One wavelength.",
    },
    ru: {
        back: "← АРКАДА KEVANDRA",
        eyebrow: "НАСКОЛЬКО НАШИ МЫСЛИ СОВПАДАЮТ?",
        subtitle: "Дай подсказку. Узнай, на одной ли мы волне ❤️",
        round: "РАУНД",
        playOnline: "❤️ Играть вместе онлайн →",
        givingClue: (name: string) => `🎭 ${name}, твоя очередь давать подсказку!`,
        makingGuess: (name: string) => `🎯 ${name}, попробуй угадать!`,
        resultsIn: "✨ Результаты готовы!",
        secretTarget: "Секретная цель",
        clueInstructions:
            "Придумай что-нибудь, что соответствует этой точке между двумя крайностями.",
        yourClue: "Твоя подсказка",
        cluePlaceholder: "Например: чашка тёплого чая",
        hideTarget: (name: string) => `Скрыть цель и передать ${name} →`,
        playersClue: (name: string) => `Подсказка от ${name}`,
        guessInstructions:
            "Как думаешь, где эта подсказка находится на шкале?",
        guessAriaLabel: "Твоя догадка на шкале",
        reveal: "Узнать, на одной ли мы волне ✨",
        perfect: "🎯 Идеальное совпадение!",
        close: "❤️ Очень близко!",
        different: "😂 Мы на разных волнах!",
        targetLabel: "СЕКРЕТНАЯ ЦЕЛЬ",
        guessLabel: "ТВОЯ ДОГАДКА",
        pointsLabel: "ОЧКИ",
        nextRound: "Следующий раунд →",
        footer: "Два сердца. Одна волна.",
    },
};


export default function Wavelength() {
    const [spectrumIndex, setSpectrumIndex] = useState(randomSpectrumIndex);

    const [language, setLanguage] = useState<WaveLanguage>(
        () =>
            localStorage.getItem("kevandra-wave-language") === "ru"
                ? "ru"
                : "en"
    );

    function changeLanguage(next: WaveLanguage) {
        setLanguage(next);
        localStorage.setItem("kevandra-wave-language", next);
    }

    const spectrum = waveSpectrums[spectrumIndex][language];
    const [target, setTarget] = useState(randomTarget);
    const [guess, setGuess] = useState(50);
    const [clue, setClue] = useState("");
    const [phase, setPhase] = useState<Phase>("clue");
    const [clueGiver, setClueGiver] = useState<Player>("Kevin");
    const [scores, setScores] = useState<Record<Player, number>>({
        Kevin: 0,
        Alexandra: 0,
    });
    const [round, setRound] = useState(1);
    const t = localWaveText[language];

    const guesser: Player =
        clueGiver === "Kevin" ? "Alexandra" : "Kevin";

    const points = calculateScore(guess, target);

    function nextRound() {
        setSpectrumIndex(previous => randomSpectrumIndex(previous));
        setTarget(randomTarget());
        setGuess(50);
        setClue("");
        setPhase("clue");
        setClueGiver(previous =>
            previous === "Kevin" ? "Alexandra" : "Kevin"
        );
        setRound(previous => previous + 1);
    }

    function reveal() {
        if (phase !== "guess") return;

        const earned = calculateScore(guess, target);

        setScores(previous => ({
            ...previous,
            [guesser]: previous[guesser] + earned,
        }));

        setPhase("reveal");
    }

    return (
        <main className="wave-page">
            <div className="wave-shell">
                <header className="wave-header">

                    <Link to="/arcade">{t.back}</Link>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            type="button"
                            onClick={() => changeLanguage(language === "en" ? "ru" : "en")}
                            style={{
                                border: "1px solid rgba(255,255,255,0.3)",
                                background: "transparent",
                                color: "inherit",
                                borderRadius: "999px",
                                padding: "6px 12px",
                                cursor: "pointer",
                                fontWeight: 700,
                            }}
                            aria-label="Switch language"
                        >
                            {language === "en" ? "EN / RU" : "RU / EN"}
                        </button>

                        <span>🦇 KEVANDRA</span>
                    </div>
                </header>

                <section className="wave-intro">
                    <span className="wave-eyebrow">
                        {t.eyebrow}
                    </span>
                    <h1>WAVELENGTH</h1>
                    <p>{t.subtitle}</p>
                </section>

                <div className="wave-scoreboard">
                    <div>
                        <span>KEVIN</span>
                        <strong>{scores.Kevin}</strong>
                    </div>

                    <div className="wave-round">
                        {t.round} {round}
                    </div>

                    <div>
                        <span>ALEXANDRA</span>
                        <strong>{scores.Alexandra}</strong>
                    </div>
                </div>

                <div className="wave-online-entry">
                    <Link to="/wavelength/online" className="wave-online-entry-link">
                        {t.playOnline}
                    </Link>
                </div>

                <section className="wave-card">
                    <div className="wave-role">
                        {phase === "clue"
                            ? t.givingClue(clueGiver)
                            : phase === "guess"
                                ? t.makingGuess(guesser)
                                : t.resultsIn}
                    </div>

                    <div className="wave-spectrum-labels">
                        <span>{spectrum[0]}</span>
                        <span>{spectrum[1]}</span>
                    </div>

                    <div className="wave-track">
                        <div className="wave-track-gradient" />

                        {(phase === "clue" || phase === "reveal") && (
                            <div
                                className="wave-target"
                                style={{ left: `${target}%` }}
                            >
                                🎯
                            </div>
                        )}

                        {(phase === "guess" || phase === "reveal") && (
                            <div
                                className="wave-guess"
                                style={{ left: `${guess}%` }}
                            >
                                ▼
                            </div>
                        )}
                    </div>

                    {phase === "clue" && (
                        <div className="wave-phase">
                            <h2>{t.secretTarget}: {target}%</h2>
                            <p>
                                {t.clueInstructions}
                            </p>

                            <label htmlFor="wave-clue">{t.yourClue}</label>

                            <input
                                id="wave-clue"
                                type="text"
                                maxLength={100}
                                placeholder={t.cluePlaceholder}
                                value={clue}
                                onChange={event =>
                                    setClue(event.target.value)
                                }
                            />

                            <button
                                className="wave-primary"
                                disabled={!clue.trim()}
                                onClick={() => setPhase("guess")}
                            >
                                {t.hideTarget(guesser)}
                            </button>
                        </div>
                    )}

                    {phase === "guess" && (
                        <div className="wave-phase">
                            <p className="wave-small-label">
                                 {t.playersClue(clueGiver)}
                            </p>

                            <h2 className="wave-clue">“{clue}”</h2>

                            <p>
                                {t.guessInstructions}
                            </p>

                            <input
                                className="wave-slider"
                                type="range"
                                min="0"
                                max="100"
                                value={guess}
                                onChange={event =>
                                    setGuess(Number(event.target.value))
                                }
                                aria-label={t.guessAriaLabel}
                            />

                            <button
                                className="wave-primary"
                                onClick={reveal}
                            >
                                {t.reveal} 
                            </button>
                        </div>
                    )}

                    {phase === "reveal" && (
                        <div className="wave-phase">
                            <h2>
                                {points === 4
                                    ? t.perfect
                                    : points >= 2
                                        ? t.close
                                        : t.different}
                            </h2>

                            <div className="wave-result-numbers">
                                <div>
                                    <span>{t.targetLabel}</span>
                                    <strong>{target}%</strong>
                                </div>
                                <div>
                                    <span>{t.guessLabel}</span>
                                    <strong>{guess}%</strong>
                                </div>
                                <div>
                                    <span>{t.pointsLabel}</span>
                                    <strong>+{points}</strong>
                                </div>
                            </div>

                            <button
                                className="wave-primary"
                                onClick={nextRound}
                            >
                                {t.nextRound}
                            </button>
                        </div>
                    )}
                </section>

                <footer className="wave-footer">
                    {t.footer}
                </footer>
            </div>
        </main>
    );
}