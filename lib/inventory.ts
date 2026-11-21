import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TransactionType } from "@/types/inventory";

// An error with a message that is safe to show to the user
export class StockError extends Error {}

type StockMovementInput = {
  productId: string;
  warehouseId: string;
  type: TransactionType;
  quantity: number;
  note: string;
  userId: string;
  userName: string;
};

// The ONLY place where stock changes after a product is created (decision 1).
// One Firestore Transaction reads the latest data and updates together:
//   - the product (total stock + stock in this warehouse)
//   - the warehouse (used units)
//   - a new inventoryTransactions record
export async function recordStockMovement({
  productId,
  warehouseId,
  type,
  quantity,
  note,
  userId,
  userName,
}: StockMovementInput) {
  // Quantity is always a positive whole number (decision 2)
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new StockError("Quantity must be a whole number greater than 0.");
  }

  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, "products", productId);
    const warehouseRef = doc(db, "warehouses", warehouseId);

    // In a transaction, all reads must happen before any write
    const productSnap = await transaction.get(productRef);
    const warehouseSnap = await transaction.get(warehouseRef);

    if (!productSnap.exists()) throw new StockError("Product not found.");
    if (!warehouseSnap.exists()) throw new StockError("Warehouse not found.");

    const product = productSnap.data();
    const warehouse = warehouseSnap.data();

    if (product.status !== "active") {
      throw new StockError("This product is inactive.");
    }
    if (product.stockByWarehouse === undefined) {
      throw new StockError("Finish the one-time warehouse setup on the Inventory page first.");
    }

    const change = type === "in" ? quantity : -quantity;

    const warehouseStock = Number(product.stockByWarehouse[warehouseId] ?? 0);
    const newWarehouseStock = warehouseStock + change;

    // Stock can never go negative (decision 3), checked per warehouse
    if (newWarehouseStock < 0) {
      throw new StockError(
        `Not enough stock in ${warehouse.name}. Available: ${warehouseStock}.`
      );
    }

    const usedUnits = Number(warehouse.usedUnits ?? 0);
    const newUsedUnits = usedUnits + change;

    // A warehouse cannot hold more than its capacity
    if (newUsedUnits > Number(warehouse.capacity)) {
      const free = Number(warehouse.capacity) - usedUnits;
      throw new StockError(`${warehouse.name} is full. Free space: ${free} unit(s).`);
    }

    const stockBefore = Number(product.currentStock);
    const stockAfter = stockBefore + change;

    transaction.update(productRef, {
      currentStock: stockAfter,
      [`stockByWarehouse.${warehouseId}`]: newWarehouseStock,
      updatedAt: serverTimestamp(),
    });

    transaction.update(warehouseRef, { usedUnits: newUsedUnits });

    transaction.set(doc(collection(db, "inventoryTransactions")), {
      productId,
      productName: product.name, // denormalized (decision 5)
      warehouseId,
      warehouseName: warehouse.name, // denormalized too
      type,
      quantity,
      stockBefore, // total stock of the product (all warehouses)
      stockAfter,
      note: note.trim(),
      createdBy: userId,
      createdByName: userName,
      createdAt: serverTimestamp(),
    });
  });
}
