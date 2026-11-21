import { Timestamp } from "firebase/firestore";

export type TransactionType = "in" | "out";

export type InventoryTransaction = {
  id: string;
  productId: string;
  productName: string;
  warehouseId?: string; // missing on movements made before warehouses existed
  warehouseName?: string;
  type: TransactionType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | null;
};
