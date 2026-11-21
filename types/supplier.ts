import { Timestamp } from "firebase/firestore";

export type Supplier = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: Timestamp | null;
};

// The fields the user fills in the form
export type SupplierFormData = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
};
