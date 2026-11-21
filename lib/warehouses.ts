import { doc, increment, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";

// Products created before warehouses existed have no "stockByWarehouse".
export function needsWarehouseSetup(product: Product) {
  return product.stockByWarehouse === undefined;
}

// One-time setup: put the old stock of these products into one warehouse.
export async function assignStockToWarehouse(products: Product[], warehouseId: string) {
  const batch = writeBatch(db);
  let totalUnits = 0;

  for (const p of products) {
    const units = p.currentStock;
    totalUnits += units;
    batch.update(doc(db, "products", p.id), {
      stockByWarehouse: units > 0 ? { [warehouseId]: units } : {},
    });
  }

  batch.update(doc(db, "warehouses", warehouseId), {
    usedUnits: increment(totalUnits),
  });

  await batch.commit();
}

// "used / capacity" as a percentage (0 - 100)
export function usagePercent(usedUnits: number, capacity: number) {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((usedUnits / capacity) * 100));
}

// Capacity status shown on warehouse cards
export function capacityStatus(usedUnits: number, capacity: number) {
  const percent = usagePercent(usedUnits, capacity);
  if (percent >= 90) return { label: "Full", color: "red" as const };
  if (percent >= 75) return { label: "Almost Full", color: "yellow" as const };
  return { label: "OK", color: "green" as const };
}
