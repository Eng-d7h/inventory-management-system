import { Timestamp } from "firebase/firestore";

export type Category = {
  id: string;
  name: string;
  createdAt: Timestamp | null;
};
