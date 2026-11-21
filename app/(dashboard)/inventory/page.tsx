"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Minus, Plus, Warehouse as WarehouseIcon } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Table, { Column } from "@/components/ui/Table";
import StockMovementModal from "@/components/inventory/StockMovementModal";
import WarehousesModal from "@/components/inventory/WarehousesModal";
import WarehouseSetupBanner from "@/components/inventory/WarehouseSetupBanner";
import { needsWarehouseSetup } from "@/lib/warehouses";
import { Warehouse } from "@/types/warehouse";
import { getStockStatus, needsAttention, stockStatusInfo } from "@/lib/stock";
import { Product } from "@/types/product";
import { TransactionType } from "@/types/inventory";

const stockColumns: Column<Product>[] = [
  {
    header: "Product",
    render: (p) => (
      <div>
        <p className="font-medium text-gray-800">{p.name}</p>
        <p className="font-mono text-xs text-gray-500">{p.sku}</p>
      </div>
    ),
  },
  { header: "Current Stock", render: (p) => <span className="font-medium">{p.currentStock}</span> },
  { header: "Minimum Stock", render: (p) => p.minimumStock },
  {
    header: "Status",
    render: (p) => {
      const info = stockStatusInfo[getStockStatus(p.currentStock, p.minimumStock)];
      return <Badge color={info.color}>{info.label}</Badge>;
    },
  },
];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Which modal is open: "in", "out", or null (closed)
  const [movementType, setMovementType] = useState<TransactionType | null>(null);
  const [lowOnly, setLowOnly] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesOpen, setWarehousesOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "products"), orderBy("name")),
      (snapshot) => {
        setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Could not load products.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "warehouses"), orderBy("name")),
      (snapshot) =>
        setWarehouses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Warehouse)),
      (err) => console.error(err)
    );
    return () => unsubscribe();
  }, []);

  // Inactive products are hidden here (decision 7)
  const activeProducts = products.filter((p) => p.status === "active");

  // Low stock alerts (active products that are low or out of stock)
  const alertProducts = activeProducts.filter(needsAttention);
  const tableProducts = lowOnly ? alertProducts : activeProducts;

  // Old products (all statuses) whose stock is not in a warehouse yet
  const setupProducts = products.filter(needsWarehouseSetup);

  return (
    <>
      <Header title="Inventory" />
      <main className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-800">Inventory</h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setWarehousesOpen(true)}
              className="flex items-center gap-1.5"
            >
              <WarehouseIcon className="h-4 w-4" /> Manage Warehouses
            </Button>
            <Button onClick={() => setMovementType("in")} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Stock In
            </Button>
            <Button
              variant="danger"
              onClick={() => setMovementType("out")}
              className="flex items-center gap-1.5"
            >
              <Minus className="h-4 w-4" /> Stock Out
            </Button>
          </div>
        </div>

        {!loading && setupProducts.length > 0 && (
          <WarehouseSetupBanner products={setupProducts} warehouses={warehouses} />
        )}

        {alertProducts.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm text-yellow-900">
            <span>
              ⚠️ <strong>{alertProducts.length}</strong> product(s) are low or out of
              stock.
            </span>
            {!lowOnly && (
              <button
                type="button"
                onClick={() => setLowOnly(true)}
                className="font-medium underline"
              >
                Show them
              </button>
            )}
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-3">
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={lowOnly}
                onChange={(e) => setLowOnly(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Low stock only
            </label>
            <Table
              columns={stockColumns}
              data={tableProducts}
              getRowKey={(p) => p.id}
              emptyMessage={
                lowOnly
                  ? "All good! No products are low or out of stock."
                  : "No active products. Add products from the Products page."
              }
            />
          </div>
        )}
      </main>

      <WarehousesModal
        open={warehousesOpen}
        onClose={() => setWarehousesOpen(false)}
        warehouses={warehouses}
      />

      {/* Render only when open, so the form starts empty every time */}
      {movementType && (
        <StockMovementModal
          open
          type={movementType}
          onClose={() => setMovementType(null)}
          products={activeProducts}
        />
      )}
    </>
  );
}
