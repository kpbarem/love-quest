import { httpsCallable } from "firebase/functions";
import {
  doc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { db, functions } from "./firebase";
import type { KevType } from "../data/kevCatalog";

export type KevOrderStatus =
  | "requested"
  | "notified"
  | "accepted"
  | "en_route"
  | "delivered"
  | "declined";

export type CreateKevOrderRequest = {
  kevType: KevType;
  activity: string;
  extras: string[];
  specialInstructions: string;
};

export type KevOrder = {
  id: string;
  kevType: KevType;
  activity: string;
  extras: string[];
  specialInstructions: string;
  status: KevOrderStatus;
  latestKevMessage?: string;
};

export async function createKevOrder(
  request: CreateKevOrderRequest
): Promise<string> {
  const callable = httpsCallable<
    CreateKevOrderRequest,
    { orderId: string }
  >(functions, "createKevOrder");

  const result = await callable(request);

  return result.data.orderId;
}

export function watchKevOrder(
  orderId: string,
  onChange: (order: KevOrder) => void
): Unsubscribe {
  const ref = doc(db, "kevOrders", orderId);

  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) {
      return;
    }

    onChange({
      id: snapshot.id,
      ...(snapshot.data() as Omit<KevOrder, "id">),
    });
  });
}