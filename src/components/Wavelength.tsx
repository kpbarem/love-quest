import { useState } from "react";
import { Link } from "react-router-dom";
import "./Wavelength.css";

type Player = "Kevin" | "Alexandra";
type Phase = "clue" | "guess" | "reveal";

type Spectrum = {
    left: string;
    right: string;
};

const spectrums: Spectrum[] = [
    { left: "Terrible", right: "Wonderful" },
    { left: "Completely normal", right: "Extremely weird" },
    { left: "Romantic", right: "Not romantic at all" },
    { left: "Harmless", right: "Dangerous" },
    { left: "Boring", right: "Exciting" },
    { left: "Underrated", right: "Overrated" },
    { left: "Easy", right: "Difficult" },
    { left: "Cute", right: "Terrifying" },
    { left: "Cheap", right: "Expensive" },
    { left: "Old-fashioned", right: "Futuristic" },
    { left: "Realistic", right: "Impossible" },
    { left: "Relaxing", right: "Stressful" },
    { left: "Sweet", right: "Spicy" },
    { left: "Ordinary", right: "Magical" },
    { left: "Innocent", right: "Mischievous" },
    { left: "Bad date idea", right: "Amazing date idea" },
    { left: "Unromantic", right: "Very romantic" },
    { left: "Forgettable", right: "Unforgettable" },
    { left: "Awkward", right: "Charming" },
    { left: "Very human", right: "Very alien" },
];

function randomTarget() {
    return Math.floor(Math.random() * 81) + 10;
}

function randomSpectrum(previous?: Spectrum): Spectrum {
    const choices = spectrums.filter(s => s !== previous);
    return choices[Math.floor(Math.random() * choices.length)];
}

function calculateScore(guess: number, target: number) {
    const distance = Math.abs(guess - target);

    if (distance <= 5) return 4;
    if (distance <= 12) return 3;
    if (distance <= 20) return 2;
    if (distance <= 30) return 1;
    return 0;
}

export default function Wavelength() {
    const [spectrum, setSpectrum] = useState<Spectrum>(
        () => randomSpectrum()
    );
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

    const guesser: Player =
        clueGiver === "Kevin" ? "Alexandra" : "Kevin";

    const points = calculateScore(guess, target);

    function nextRound() {
        setSpectrum(previous => randomSpectrum(previous));
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
                    <Link to="/arcade">← KEVANDRA ARCADE</Link>
                    <span>🦇 KEVANDRA</span>
                </header>

                <section className="wave-intro">
                    <span className="wave-eyebrow">
                        HOW WELL DO OUR MINDS ALIGN?
                    </span>
                    <h1>WAVELENGTH</h1>
                    <p>Give a clue. Find if we are on the same wave ❤️</p>
                </section>

                <div className="wave-scoreboard">
                    <div>
                        <span>KEVIN</span>
                        <strong>{scores.Kevin}</strong>
                    </div>

                    <div className="wave-round">
                        ROUND {round}
                    </div>

                    <div>
                        <span>ALEXANDRA</span>
                        <strong>{scores.Alexandra}</strong>
                    </div>
                </div>

                <div className="wave-online-entry">
                    <Link to="/wavelength/online" className="wave-online-entry-link">
                        ❤️ Play Together Online →
                    </Link>
                </div>

                <section className="wave-card">
                    <div className="wave-role">
                        {phase === "clue"
                            ? `🎭 ${clueGiver}, you're giving the clue!`
                            : phase === "guess"
                                ? `🎯 ${guesser}, make your guess!`
                                : "✨ The results are in!"}
                    </div>

                    <div className="wave-spectrum-labels">
                        <span>{spectrum.left}</span>
                        <span>{spectrum.right}</span>
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
                            <h2>Secret target: {target}%</h2>
                            <p>
                                Think of something that belongs at this
                                position between the two extremes.
                            </p>

                            <label htmlFor="wave-clue">Your clue</label>

                            <input
                                id="wave-clue"
                                type="text"
                                maxLength={100}
                                placeholder="Example: A cup of warm tea"
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
                                Hide Target & Pass to {guesser} →
                            </button>
                        </div>
                    )}

                    {phase === "guess" && (
                        <div className="wave-phase">
                            <p className="wave-small-label">
                                {clueGiver}'S CLUE
                            </p>

                            <h2 className="wave-clue">“{clue}”</h2>

                            <p>
                                Where do you think this belongs on the spectrum?
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
                                aria-label="Your guess on the spectrum"
                            />

                            <button
                                className="wave-primary"
                                onClick={reveal}
                            >
                                Reveal Our Wavelength ✨
                            </button>
                        </div>
                    )}

                    {phase === "reveal" && (
                        <div className="wave-phase">
                            <h2>
                                {points === 4
                                    ? "🎯 Perfect connection!"
                                    : points >= 2
                                        ? "❤️ Pretty close!"
                                        : "😂 Different wavelengths!"}
                            </h2>

                            <div className="wave-result-numbers">
                                <div>
                                    <span>SECRET TARGET</span>
                                    <strong>{target}%</strong>
                                </div>
                                <div>
                                    <span>YOUR GUESS</span>
                                    <strong>{guess}%</strong>
                                </div>
                                <div>
                                    <span>POINTS</span>
                                    <strong>+{points}</strong>
                                </div>
                            </div>

                            <button
                                className="wave-primary"
                                onClick={nextRound}
                            >
                                Next Round →
                            </button>
                        </div>
                    )}
                </section>

                <footer className="wave-footer">
                    Two minds. One wavelength.
                </footer>
            </div>
        </main>
    );
}