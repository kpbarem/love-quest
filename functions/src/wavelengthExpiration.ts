import { Timestamp } from "firebase-admin/firestore";

export const WAITING_ROOM_MS = 24 * 60 * 60 * 1000;
export const ACTIVE_ROOM_MS = 7 * 24 * 60 * 60 * 1000;

export function expirationFromNow(durationMs: number): Timestamp {
    return Timestamp.fromMillis(Date.now() + durationMs);
}

export function isRoomExpired(room: {
    expiresAt?: Timestamp;
}): boolean {
    // Rooms created before this update have no expiration.
    // We'll handle those separately.
    if (!room.expiresAt) return false;

    return room.expiresAt.toMillis() <= Date.now();
}