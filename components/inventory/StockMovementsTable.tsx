"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Badge from "@/components/ui/Badge";
import Table, { Column } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/format";
import { InventoryTransaction } from "@/types/inventory";

// Read-only history: no edit, no delete (decision 13)
const columns: Column<InventoryTransaction>[] = [
  {
    header: "Date",
    render: (t) => <span className="whitespace-nowrap">{formatDateTime(t.createdAt)}</span>,
  },
  { header: "Product", render: (t) => <span className="font-medium">{t.productName}</span> },
  {
    header: "Type",
    render: (t) =>
      t.type === "in" ? <Badge color="green">IN</Badge> : <Badge color="red">OUT</Badge>,
  },
  {
    header: "Quantity",
    render: (t) => (
      <span className={`font-medium ${t.type === "in" ? "text-green-700" : "text-danger"}`}>
        {t.type === "in" ? "+" : "−"}
        {t.quantity}
      </span>
    ),
  },
  {
    header: "Stock",
    render: (t) => (
      <span className="whitespace-nowrap text-gray-600">
        {t.stockBefore} → <strong className="text-gray-800">{t.stockAfter}</strong>
      </span>
    ),
  },
  { header: "Note", render: (t) => t.note || <span className="text-gray-400">-</span> },
  { header: "By", render: (t) => t.createdByName },
];

export default function StockMovementsTable() {
  const [movements, setMovements] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Newest first
    const q = query(collection(db, "inventoryTransactions"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMovements(
          snapshot.docs.map(
            (d) =>
              ({
                id: d.id,
                // "estimate" shows a date right away, before the server confirms it
                ...d.data({ serverTimestamps: "estimate" }),
              }) as InventoryTransaction
          )
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Could not load stock movements.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-danger">{error}</p>}
      <Table
        columns={columns}
        data={movements}
        getRowKey={(t) => t.id}
        emptyMessage="No stock movements yet."
      />
    </div>
  );
}
