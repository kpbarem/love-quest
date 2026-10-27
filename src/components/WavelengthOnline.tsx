import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions, ensureAnonymousAuth } from "../lib/firebase";
import "./WavelengthOnline.css";
import {
    waveSpectrums,
    waveText,
    type WaveLanguage,
} from "./wavelengthTranslations";

type Phase = "clue" | "guess" | "reveal";

type Room = {
    players: string[];
    hostUid: string;
    guestUid: string | null;
    status: "waiting" | "ready";
    round: number;
    scores: number[];
    phase?: Phase;
    spectrumIndex?: number;
    clue?: string | null;
    guess?: number | null;
    target?: number | null;
    points?: number | null;
};

type RoomResponse = {
    roomId: string;
    playerNumber: number;
};

type TargetResponse = {
    target: number;
    round: number;
};

// const spectrums = [
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

const createRoom = httpsCallable<undefined, RoomResponse>(
    functions,
    "createWavelengthRoom"
);

const joinRoom = httpsCallable<{ roomId: string }, RoomResponse>(
    functions,
    "joinWavelengthRoom"
);

const getTarget = httpsCallable<{ roomId: string }, TargetResponse>(
    functions,
    "getWavelengthTarget"
);

const submitClue = httpsCallable<
    { roomId: string; clue: string },
    { success: boolean }
>(functions, "submitWavelengthClue");

const submitGuess = httpsCallable<
    { roomId: string; guess: number },
    { success: boolean }
>(functions, "submitWavelengthGuess");

const nextRound = httpsCallable<
    { roomId: string },
    { success: boolean }
>(functions, "nextWavelengthRound");

function playerName(index: number) {
    return index === 0 ? "Kevin" : "Alexandra";
}

function scoreMessage(
    points: number,
    language: WaveLanguage
) {
    const t = waveText[language];

    if (points === 4) return t.perfect;
    if (points >= 2) return t.close;
    return t.different;
}

export default function WavelengthOnline() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();

    const [room, setRoom] = useState<Room | null>(null);
    const [playerNumber, setPlayerNumber] = useState<number | null>(null);
    const [loading, setLoading] = useState(Boolean(roomId));
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const [secret, setSecret] = useState<TargetResponse | null>(null);
    const [clue, setClue] = useState("");
    const [guess, setGuess] = useState(50);

    const [language, setLanguage] = useState<WaveLanguage>(() =>
        localStorage.getItem("kevandra-wave-language") === "ru" ? "ru" : "en"
    );

    const t = waveText[language];

    function changeLanguage(next: WaveLanguage) {
        setLanguage(next);
        localStorage.setItem("kevandra-wave-language", next);
    }

    useEffect(() => {
        if (!roomId) return;

        let cancelled = false;
        let unsubscribe: (() => void) | undefined;

        setRoom(null);
        setPlayerNumber(null);
        setSecret(null);
        setLoading(true);
        setError("");

        async function connect() {
            try {
                await ensureAnonymousAuth();
                const result = await joinRoom({ roomId: roomId! });

                if (cancelled) return;

                setPlayerNumber(result.data.playerNumber);

                unsubscribe = onSnapshot(
                    doc(db, "wavelengthRooms", roomId!),
                    snapshot => {
                        if (cancelled) return;

                        if (!snapshot.exists()) {
                            setError("This room no longer exists.");
                            setLoading(false);
                            return;
                        }

                        setRoom(snapshot.data() as Room);
                        setLoading(false);
                    },
                    err => {
                        if (cancelled) return;
                        console.error(err);
                        setError("Could not connect to the room.");
                        setLoading(false);
                    }
                );
            } catch (err) {
                if (cancelled) return;
                console.error(err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to join the room."
                );
                setLoading(false);
            }
        }

        void connect();

        return () => {
            cancelled = true;
            unsubscribe?.();
        };
    }, [roomId]);

    // Only the current clue giver requests the secret target.
    // The guesser never calls this function.
    useEffect(() => {
        if (
            !roomId ||
            !room ||
            room.status !== "ready" ||
            playerNumber === null
        ) {
            return;
        }

        const clueGiverIndex = (room.round - 1) % 2;
        const myIndex = playerNumber - 1;

        if (myIndex !== clueGiverIndex) {
            setSecret(null);
            return;
        }

        if (room.phase && room.phase !== "clue") {
            setSecret(null);
            return;
        }

        if (secret?.round === room.round) return;

        let cancelled = false;

        async function loadTarget() {
            try {
                const result = await getTarget({ roomId: roomId! });

                if (!cancelled) {
                    setSecret(result.data);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(err);
                    setError("Could not load the secret target.");
                }
            }
        }

        void loadTarget();

        return () => {
            cancelled = true;
        };
    }, [roomId, room, playerNumber, secret]);

    async function handleCreateRoom() {
        if (creating) return;

        setCreating(true);
        setError("");

        try {
            await ensureAnonymousAuth();
            const result = await createRoom();

            navigate(`/wavelength/room/${result.data.roomId}`);
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not create a room."
            );
            setCreating(false);
        }
    }

    async function handleCopyLink() {
        if (!roomId) return;

        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
        } catch {
            setError("Unable to copy. Please copy the URL manually.");
        }
    }

    async function handleSubmitClue() {
        if (!roomId || !clue.trim() || busy) return;

        setBusy(true);
        setError("");

        try {
            await submitClue({ roomId, clue: clue.trim() });
            setSecret(null);
        } catch (err) {
            console.error(err);
            setError("Could not submit the clue. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    async function handleSubmitGuess() {
        if (!roomId || busy) return;

        setBusy(true);
        setError("");

        try {
            await submitGuess({ roomId, guess });
        } catch (err) {
            console.error(err);
            setError("Could not submit the guess. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    async function handleNextRound() {
        if (!roomId || busy) return;

        setBusy(true);
        setError("");

        try {
            await nextRound({ roomId });
            setSecret(null);
            setClue("");
            setGuess(50);
        } catch (err) {
            console.error(err);
            setError("Could not start the next round.");
        } finally {
            setBusy(false);
        }
    }

    const myIndex = playerNumber === null ? -1 : playerNumber - 1;
    const clueGiverIndex = room ? (room.round - 1) % 2 : 0;
    const guesserIndex = 1 - clueGiverIndex;

    const isClueGiver = myIndex === clueGiverIndex;
    const isGuesser = myIndex === guesserIndex;

    const spectrum =
        room?.spectrumIndex !== undefined
            ? waveSpectrums[room.spectrumIndex]?.[language]
            : null;

    const phase = room?.phase ?? "clue";

    const hasMySecret =
        secret !== null && secret.round === room?.round;

    return (
        <main className="wave-online-page">
            <div className="wave-online-shell">
                <header className="wave-online-header">
                    <Link to="/arcade">{t.back}</Link>
                    <div className="wave-online-language">
                        <button
                            type="button"
                            className={language === "en" ? "active" : ""}
                            onClick={() => changeLanguage("en")}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            className={language === "ru" ? "active" : ""}
                            onClick={() => changeLanguage("ru")}
                        >
                            RU
                        </button>
                    </div>
                </header>

                <section className="wave-online-card">
                    <div className="wave-online-icon">❤️</div>
                    <h1>{t.title}</h1>

                    {!roomId && (
                        <>
                            <p>
                                {t.intro}
                            </p>

                            <button
                                className="wave-online-primary"
                                onClick={handleCreateRoom}
                                disabled={creating}
                            >
                                {creating ? t.creating : t.createRoom}
                            </button>

                            <Link
                                to="/wavelength"
                                className="wave-online-secondary"
                            >
                                {t.playLocal}
                            </Link>
                        </>
                    )}

                    {roomId && loading && (
                        <p>{t.connecting}</p>
                    )}

                    {roomId && !loading && room?.status === "waiting" && (
                        <>
                            <h2>{t.waiting}</h2>
                            <p>
                                {t.inviteInstructions}
                            </p>

                            <button
                                className="wave-online-primary"
                                onClick={handleCopyLink}
                            >
                                {copied ? t.copied : t.copyLink}
                            </button>

                            <div className="wave-online-status">
                                <span>{t.playerOne}</span>
                                <span>{t.playerTwoWaiting}</span>
                            </div>
                        </>
                    )}

                    {roomId && !loading && room?.status === "ready" && (
                        <>
                            <div className="wave-online-player">
                                {t.player} {playerName(myIndex)}
                            </div>

                            <div className="wave-online-scoreboard">
                                <div>
                                    <span>KEVIN</span>
                                    <strong>{room.scores[0]}</strong>
                                </div>

                                <div className="wave-online-round">
                                    {t.round} {room.round}
                                </div>

                                <div>
                                    <span>ALEXANDRA</span>
                                    <strong>{room.scores[1]}</strong>
                                </div>
                            </div>

                            {spectrum && (
                                <>
                                    <div className="wave-online-spectrum-labels">
                                        <span>{spectrum[0]}</span>
                                        <span>{spectrum[1]}</span>
                                    </div>

                                    <div className="wave-online-track">
                                        <div className="wave-online-gradient" />

                                        {phase === "clue" &&
                                            isClueGiver &&
                                            hasMySecret && (
                                                <div
                                                    className="wave-online-target"
                                                    style={{
                                                        left: `${secret.target}%`,
                                                    }}
                                                >
                                                    🎯
                                                </div>
                                            )}

                                        {phase === "guess" &&
                                            isGuesser && (
                                                <div
                                                    className="wave-online-guess"
                                                    style={{
                                                        left: `${guess}%`,
                                                    }}
                                                >
                                                    ▼
                                                </div>
                                            )}

                                        {phase === "reveal" && (
                                            <>
                                                <div
                                                    className="wave-online-target"
                                                    style={{
                                                        left: `${room.target}%`,
                                                    }}
                                                >
                                                    🎯
                                                </div>
                                                <div
                                                    className="wave-online-guess"
                                                    style={{
                                                        left: `${room.guess}%`,
                                                    }}
                                                >
                                                    ▼
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {phase === "clue" && isClueGiver && (
                                <div className="wave-online-phase">
                                    <h2>{t.secretTarget}</h2>

                                    {hasMySecret ? (
                                        <>
                                            <div className="wave-online-secret">
                                                {secret.target}%
                                            </div>

                                            <p>
                                                {t.giveClue}
                                            </p>

                                            <input
                                                type="text"
                                                maxLength={100}
                                                value={clue}
                                                placeholder={t.cluePlaceholder}
                                                onChange={event =>
                                                    setClue(event.target.value)
                                                }
                                            />

                                            <button
                                                className="wave-online-primary"
                                                disabled={!clue.trim() || busy}
                                                onClick={handleSubmitClue}
                                            >
                                                {busy
                                                    ? t.sending
                                                    : t.sendClue}
                                            </button>
                                        </>
                                    ) : (
                                        <p>{t.preparingTarget}</p>
                                    )}
                                </div>
                            )}

                            {phase === "clue" && !isClueGiver && (
                                <div className="wave-online-phase">
                                    <h2>{t.waitingFor} {playerName(clueGiverIndex)}...</h2>
                                    <p>
                                        {t.waitingClue}
                                    </p>
                                </div>
                            )}

                            {phase === "guess" && isGuesser && (
                                <div className="wave-online-phase">
                                    <p className="wave-online-small-label">
                                        {language === "ru"
                                            ? `${t.clueLabel} ${playerName(clueGiverIndex)}`
                                            : `${playerName(clueGiverIndex)}${t.clueLabel}`}
                                    </p>

                                    <h2 className="wave-online-clue">
                                        “{room.clue}”
                                    </h2>

                                    <p>
                                        {t.whereBelongs}
                                    </p>

                                    <input
                                        className="wave-online-slider"
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
                                        className="wave-online-primary"
                                        disabled={busy}
                                        onClick={handleSubmitGuess}
                                    >
                                        {busy
                                            ? t.submitting
                                            : t.reveal}
                                    </button>
                                </div>
                            )}

                            {phase === "guess" && !isGuesser && (
                                <div className="wave-online-phase">
                                    <h2>{t.clueSent}</h2>
                                    <p>
                                      {t.waitingGuess}
                                    </p>
                                </div>
                            )}

                            {phase === "reveal" && (
                                <div className="wave-online-phase">
                                    <h2>{scoreMessage(room.points ?? 0, language)}</h2>

                                    <div className="wave-online-results">
                                        <div>
                                            <span>{t.target}</span>
                                            <strong>{room.target}%</strong>
                                        </div>
                                        <div>
                                            <span>{t.guess}</span>
                                            <strong>{room.guess}%</strong>
                                        </div>
                                        <div>
                                            <span>{t.points}</span>
                                            <strong>+{room.points}</strong>
                                        </div>
                                    </div>

                                    <button
                                        className="wave-online-primary"
                                        disabled={busy}
                                        onClick={handleNextRound}
                                    >
                                        {busy
                                            ? t.starting
                                            : t.nextRound}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {error && (
                        <p className="wave-online-error" role="alert">
                            {error}
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}