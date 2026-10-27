import { randomInt } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

const rooms = db.collection("wavelengthRooms");
const secrets = db.collection("wavelengthSecrets");

const spectrums = [
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

function getContext(request: {
    auth?: { uid: string };
    data?: unknown;
}) {
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const data = request.data as Record<string, unknown> | undefined;
    const roomId = data?.roomId;

    if (
        typeof roomId !== "string" ||
        !/^[A-Za-z0-9]{20}$/.test(roomId)
    ) {
        throw new HttpsError("invalid-argument", "Invalid room ID.");
    }

    return { uid, roomId, data };
}

function requirePlayer(room: FirebaseFirestore.DocumentData, uid: string) {
    if (
        !Array.isArray(room.players) ||
        !room.players.includes(uid)
    ) {
        throw new HttpsError(
            "permission-denied",
            "You are not a player in this room."
        );
    }
}

function clueGiverUid(room: FirebaseFirestore.DocumentData): string {
    return room.players[(room.round - 1) % 2];
}

function guesserUid(room: FirebaseFirestore.DocumentData): string {
    return room.players[room.round % 2];
}

function scoreGuess(guess: number, target: number): number {
    const distance = Math.abs(guess - target);

    if (distance <= 5) return 4;
    if (distance <= 12) return 3;
    if (distance <= 20) return 2;
    if (distance <= 30) return 1;
    return 0;
}

function randomSpectrumIndex(previous?: number): number {
    if (previous === undefined) {
        return randomInt(spectrums.length);
    }

    // Choose a different spectrum from the previous round.
    const next = randomInt(spectrums.length - 1);
    return next >= previous ? next + 1 : next;
}

function randomTarget(): number {
    return randomInt(10, 91);
}

// Start the first round and retrieve the clue giver's secret target.
// This function is intentionally restricted to the clue giver.
export const getWavelengthTarget = onCall(
    { cors: true },
    async request => {
        const { uid, roomId } = getContext(request);
        const roomRef = rooms.doc(roomId);
        const secretRef = secrets.doc(roomId);

        return db.runTransaction(async transaction => {
            const roomSnapshot = await transaction.get(roomRef);
            const secretSnapshot = await transaction.get(secretRef);

            if (!roomSnapshot.exists) {
                throw new HttpsError("not-found", "Room not found.");
            }

            const room = roomSnapshot.data()!;
            requirePlayer(room, uid);

            if (room.status !== "ready" || room.players.length !== 2) {
                throw new HttpsError(
                    "failed-precondition",
                    "Waiting for both players."
                );
            }

            if (clueGiverUid(room) !== uid) {
                throw new HttpsError(
                    "permission-denied",
                    "Only the clue giver can see the target."
                );
            }

            if (room.phase && room.phase !== "clue") {
                throw new HttpsError(
                    "failed-precondition",
                    "The clue phase has ended."
                );
            }

            // Initialize the first round once, even if both devices
            // refresh or the function is called repeatedly.
            if (!secretSnapshot.exists) {
                const target = randomTarget();
                const spectrumIndex = randomSpectrumIndex();

                transaction.set(secretRef, {
                    round: room.round,
                    target,
                });

                transaction.update(roomRef, {
                    phase: "clue",
                    spectrumIndex,
                    clue: null,
                    guess: null,
                    target: null,
                    points: null,
                    updatedAt: FieldValue.serverTimestamp(),
                });

                return { target, round: room.round };
            }

            const secret = secretSnapshot.data()!;

            if (secret.round !== room.round) {
                throw new HttpsError(
                    "failed-precondition",
                    "Round state is inconsistent."
                );
            }

            return {
                target: secret.target as number,
                round: room.round as number,
            };
        });
    }
);

// Only the clue giver can submit a clue.
export const submitWavelengthClue = onCall(
    { cors: true },
    async request => {
        const { uid, roomId, data } = getContext(request);
        const clue = data?.clue;

        if (
            typeof clue !== "string" ||
            clue.trim().length < 1 ||
            clue.trim().length > 100
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Clue must be between 1 and 100 characters."
            );
        }

        const roomRef = rooms.doc(roomId);
        const secretRef = secrets.doc(roomId);

        await db.runTransaction(async transaction => {
            const roomSnapshot = await transaction.get(roomRef);
            const secretSnapshot = await transaction.get(secretRef);

            if (!roomSnapshot.exists || !secretSnapshot.exists) {
                throw new HttpsError(
                    "failed-precondition",
                    "Round has not started."
                );
            }

            const room = roomSnapshot.data()!;
            const secret = secretSnapshot.data()!;
            requirePlayer(room, uid);

            if (
                room.status !== "ready" ||
                room.phase !== "clue" ||
                clueGiverUid(room) !== uid ||
                secret.round !== room.round
            ) {
                throw new HttpsError(
                    "failed-precondition",
                    "You cannot submit a clue right now."
                );
            }

            transaction.update(roomRef, {
                clue: clue.trim(),
                phase: "guess",
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        return { success: true };
    }
);

// Only the guesser can submit a guess.
// Scoring and revealing happen atomically on the server.
export const submitWavelengthGuess = onCall(
    { cors: true },
    async request => {
        const { uid, roomId, data } = getContext(request);
        const guess = data?.guess;

        if (
            typeof guess !== "number" ||
            !Number.isInteger(guess) ||
            guess < 0 ||
            guess > 100
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Guess must be between 0 and 100."
            );
        }

        const roomRef = rooms.doc(roomId);
        const secretRef = secrets.doc(roomId);

        await db.runTransaction(async transaction => {
            const roomSnapshot = await transaction.get(roomRef);
            const secretSnapshot = await transaction.get(secretRef);

            if (!roomSnapshot.exists || !secretSnapshot.exists) {
                throw new HttpsError(
                    "failed-precondition",
                    "Round not found."
                );
            }

            const room = roomSnapshot.data()!;
            const secret = secretSnapshot.data()!;
            requirePlayer(room, uid);

            if (
                room.status !== "ready" ||
                room.phase !== "guess" ||
                guesserUid(room) !== uid ||
                secret.round !== room.round
            ) {
                throw new HttpsError(
                    "failed-precondition",
                    "It is not your turn to guess."
                );
            }

            const target = secret.target as number;
            const points = scoreGuess(guess, target);
            const playerIndex = room.players.indexOf(uid);

            const scores = [...room.scores] as number[];
            scores[playerIndex] += points;

            transaction.update(roomRef, {
                guess,
                target,
                points,
                scores,
                phase: "reveal",
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        return { success: true };
    }
);

// Either participant can advance the game after the reveal.
export const nextWavelengthRound = onCall(
    { cors: true },
    async request => {
        const { uid, roomId } = getContext(request);
        const roomRef = rooms.doc(roomId);
        const secretRef = secrets.doc(roomId);

        await db.runTransaction(async transaction => {
            const roomSnapshot = await transaction.get(roomRef);
            const secretSnapshot = await transaction.get(secretRef);

            if (!roomSnapshot.exists || !secretSnapshot.exists) {
                throw new HttpsError("not-found", "Round not found.");
            }

            const room = roomSnapshot.data()!;
            requirePlayer(room, uid);

            if (
                room.status !== "ready" ||
                room.phase !== "reveal"
            ) {
                throw new HttpsError(
                    "failed-precondition",
                    "The current round is not finished."
                );
            }

            const nextRound = room.round + 1;
            const nextSpectrum = randomSpectrumIndex(
                room.spectrumIndex
            );

            transaction.set(secretRef, {
                round: nextRound,
                target: randomTarget(),
            });

            transaction.update(roomRef, {
                round: nextRound,
                spectrumIndex: nextSpectrum,
                phase: "clue",
                clue: null,
                guess: null,
                target: null,
                points: null,
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        return { success: true };
    }
);