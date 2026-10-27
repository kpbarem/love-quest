import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
    WAITING_ROOM_MS,
    ACTIVE_ROOM_MS,
    expirationFromNow,
    isRoomExpired,
} from "./wavelengthExpiration";

const db = getFirestore();
const rooms = db.collection("wavelengthRooms");

function requireUser(uid: string | undefined): string {
    if (!uid) {
        throw new HttpsError(
            "unauthenticated",
            "Please sign in before joining a game."
        );
    }

    return uid;
}

export const createWavelengthRoom = onCall(
    { cors: true },
    async (request) => {
        const uid = requireUser(request.auth?.uid);

        // Firestore generates a random 20-character document ID.
        const roomRef = rooms.doc();

        await roomRef.set({
            players: [uid],
            hostUid: uid,
            guestUid: null,
            status: "waiting",
            round: 1,
            scores: [0, 0],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            expiresAt: expirationFromNow(WAITING_ROOM_MS),
        });

        return {
            roomId: roomRef.id,
            playerNumber: 1,
        };
    }
);

export const joinWavelengthRoom = onCall(
    { cors: true },
    async (request) => {
        const uid = requireUser(request.auth?.uid);
        const roomId = request.data?.roomId;

        if (
            typeof roomId !== "string" ||
            !/^[A-Za-z0-9]{20}$/.test(roomId)
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Invalid room invitation."
            );
        }

        const roomRef = rooms.doc(roomId);

        const playerNumber = await db.runTransaction(
            async transaction => {
                const snapshot = await transaction.get(roomRef);

                if (!snapshot.exists) {
                    throw new HttpsError(
                        "not-found",
                        "This room doesn't exist."
                    );
                }

                const room = snapshot.data()!;
                const players = room.players as string[];

                if (isRoomExpired(room)) {
                    throw new HttpsError(
                        "failed-precondition",
                        "This invitation has expired. Please create a new room."
                    );
                }

                // Rejoining from the same browser is allowed.
                if (players.includes(uid)) {
                    return players.indexOf(uid) + 1;
                }

                if (players.length >= 2) {
                    throw new HttpsError(
                        "failed-precondition",
                        "This room already has two players."
                    );
                }

                if (room.status !== "waiting") {
                    throw new HttpsError(
                        "failed-precondition",
                        "This room is no longer accepting players."
                    );
                }

                transaction.update(roomRef, {
                    players: [players[0], uid],
                    guestUid: uid,
                    status: "ready",
                    updatedAt: FieldValue.serverTimestamp(),
                    expiresAt: expirationFromNow(ACTIVE_ROOM_MS),
                });

                return 2;
            }
        );

        return {
            roomId,
            playerNumber,
        };
    }
);