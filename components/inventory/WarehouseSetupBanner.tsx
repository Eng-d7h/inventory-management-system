"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { assignStockToWarehouse } from "@/lib/warehouses";
import { Product } from "@/types/product";
import { Warehouse } from "@/types/warehouse";

// Shown only while some products were created before warehouses existed
export default function WarehouseSetupBanner({
  products,
  warehouses,
}: {
  products: Product[]; // products that still need setup
  warehouses: Warehouse[];
}) {
  const [warehouseId, setWarehouseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const units = products.reduce((sum, p) => sum + p.currentStock, 0);

  async function handleAssign() {
    if (!warehouseId) {
      setError("Please choose a warehouse.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await assignStockToWarehouse(products, warehouseId);
    } catch (err) {
      console.error(err);
      setError("Could not assign the stock. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-gray-700">
      <p>
        <strong>One-time setup:</strong> {products.length} product(s) with {units} unit(s)
        were created before warehouses existed. Choose the warehouse that holds this stock.
      </p>
      {warehouses.length === 0 ? (
        <p className="text-gray-500">First create a warehouse with “Manage Warehouses”.</p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="sm:w-64">
            <Select
              name="setupWarehouse"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              placeholder="Choose a warehouse"
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              error={error}
            />
          </div>
          <Button onClick={handleAssign} disabled={saving} className="py-2.5">
            {saving ? "Assigning..." : "Assign stock"}
          </Button>
        </div>
      )}
    </div>
  );
}
