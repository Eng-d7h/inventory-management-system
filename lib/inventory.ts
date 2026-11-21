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
  type: TransactionType;
  quantity: number;
  note: string;
  userId: string;
  userName: string;
};

// The ONLY place where currentStock changes after a product is created (decision 1).
// A Firestore Transaction reads the latest stock and writes both documents together.
export async function recordStockMovement({
  productId,
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
    const snap = await transaction.get(productRef);

    if (!snap.exists()) {
      throw new StockError("Product not found.");
    }

    const product = snap.data();
    if (product.status !== "active") {
      throw new StockError("This product is inactive.");
    }

    const stockBefore = Number(product.currentStock);
    const stockAfter = type === "in" ? stockBefore + quantity : stockBefore - quantity;

    // Stock can never go negative (decision 3)
    if (stockAfter < 0) {
      throw new StockError(`Not enough stock. Available: ${stockBefore}.`);
    }

    transaction.update(productRef, {
      currentStock: stockAfter,
      updatedAt: serverTimestamp(),
    });

    transaction.set(doc(collection(db, "inventoryTransactions")), {
      productId,
      productName: product.name, // denormalized (decision 5)
      type,
      quantity,
      stockBefore,
      stockAfter,
      note: note.trim(),
      createdBy: userId,
      createdByName: userName,
      createdAt: serverTimestamp(),
    });
  });
}
