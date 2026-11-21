import { Timestamp } from "firebase/firestore";

export type TransactionType = "in" | "out";

export type InventoryTransaction = {
  id: string;
  productId: string;
  productName: string;
  type: TransactionType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | null;
};
