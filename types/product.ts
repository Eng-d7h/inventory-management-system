import { Timestamp } from "firebase/firestore";

export type ProductStatus = "active" | "inactive";

export type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  supplierId: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number; // total of all warehouses
  // Units per warehouse: { warehouseId: units }. Missing on old products.
  stockByWarehouse?: Record<string, number>;
  minimumStock: number;
  status: ProductStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};
