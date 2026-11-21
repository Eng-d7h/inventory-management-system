import { Timestamp } from "firebase/firestore";

export type Warehouse = {
  id: string;
  name: string;
  location: string;
  capacity: number; // max units the warehouse can hold
  usedUnits: number; // units stored now (updated by every stock movement)
  createdAt: Timestamp | null;
};
