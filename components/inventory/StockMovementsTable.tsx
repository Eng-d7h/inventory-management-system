"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
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

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "", "in" or "out"
  const [fromDate, setFromDate] = useState(""); // "2026-11-01"
  const [toDate, setToDate] = useState("");

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

  // Dates from the inputs: start of "from" day and end of "to" day (local time)
  const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
  const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
  const searchText = search.trim().toLowerCase();

  const filtered = movements.filter((t) => {
    if (searchText && !t.productName.toLowerCase().includes(searchText)) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    const date = t.createdAt?.toDate();
    if (from && (!date || date < from)) return false;
    if (to && (!date || date > to)) return false;
    return true;
  });

  const hasFilters = !!(search || typeFilter || fromDate || toDate);

  function clearFilters() {
    setSearch("");
    setTypeFilter("");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          name="search"
          type="search"
          placeholder="Product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="Type"
          name="typeFilter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="All types"
          options={[
            { value: "in", label: "IN (Stock In)" },
            { value: "out", label: "OUT (Stock Out)" },
          ]}
        />
        <Input
          label="From"
          name="fromDate"
          type="date"
          value={fromDate}
          max={toDate || undefined}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          label="To"
          name="toDate"
          type="date"
          value={toDate}
          min={fromDate || undefined}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {filtered.length} of {movements.length} movements
        </span>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="font-medium text-primary hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Table
        columns={columns}
        data={filtered}
        getRowKey={(t) => t.id}
        emptyMessage={
          movements.length === 0
            ? "No stock movements yet."
            : "No movements match your filters."
        }
      />
    </div>
  );
}
