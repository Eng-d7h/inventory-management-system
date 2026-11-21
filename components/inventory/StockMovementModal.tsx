"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { recordStockMovement, StockError } from "@/lib/inventory";
import { Product } from "@/types/product";
import { TransactionType } from "@/types/inventory";
import { Warehouse } from "@/types/warehouse";

export default function StockMovementModal({
  open,
  onClose,
  type,
  products,
  warehouses,
}: {
  open: boolean;
  onClose: () => void;
  type: TransactionType;
  products: Product[]; // active products only
  warehouses: Warehouse[];
}) {
  const { user, profile } = useAuth();
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{
    productId?: string;
    warehouseId?: string;
    quantity?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isOut = type === "out";
  const selected = products.find((p) => p.id === productId);
  const warehouse = warehouses.find((w) => w.id === warehouseId);
  const qty = Number(quantity);

  // Stock of the chosen product in the chosen warehouse
  const available =
    selected && warehouse ? selected.stockByWarehouse?.[warehouse.id] ?? 0 : null;
  const freeSpace = warehouse ? warehouse.capacity - warehouse.usedUnits : null;

  // Live checks: Stock Out cannot exceed the available stock,
  // Stock In cannot exceed the free space of the warehouse
  const limit = isOut ? available : freeSpace;
  const tooMuch = limit !== null && quantity !== "" && qty > limit;

  async function handleSave() {
    const newErrors: typeof errors = {};
    if (!productId) newErrors.productId = "Please choose a product.";
    if (!warehouseId) newErrors.warehouseId = "Please choose a warehouse.";
    if (!Number.isInteger(qty) || qty <= 0) {
      newErrors.quantity = "Enter a whole number greater than 0.";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || tooMuch || !user) return;

    setSaving(true);
    setSaveError("");
    try {
      await recordStockMovement({
        productId,
        warehouseId,
        type,
        quantity: qty,
        note,
        userId: user.uid,
        userName: profile?.name ?? user.email ?? "Unknown",
      });
      onClose();
    } catch (err) {
      console.error(err);
      setSaveError(
        err instanceof StockError
          ? err.message
          : "Could not save the movement. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isOut ? "Stock Out" : "Stock In"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={isOut ? "danger" : "primary"}
            onClick={handleSave}
            disabled={saving || tooMuch}
          >
            {saving ? "Saving..." : isOut ? "Remove Stock" : "Add Stock"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Select
            label="Product"
            name="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            error={errors.productId}
            placeholder={products.length ? "Choose a product" : "No active products"}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.sku})`,
            }))}
          />
        </div>

        <div>
          <Select
            label="Warehouse"
            name="warehouseId"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            error={errors.warehouseId}
            placeholder={warehouses.length ? "Choose a warehouse" : "No warehouses yet"}
            options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.location})` }))}
          />
          {isOut && available !== null && (
            <p className="mt-1 text-sm text-gray-600">
              Available in this warehouse: <strong>{available}</strong>
            </p>
          )}
          {!isOut && freeSpace !== null && (
            <p className="mt-1 text-sm text-gray-600">
              Free space: <strong>{freeSpace.toLocaleString()}</strong> unit(s)
            </p>
          )}
        </div>

        <Input
          label="Quantity"
          name="quantity"
          type="number"
          min="1"
          step="1"
          placeholder="e.g. 10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={
            errors.quantity ??
            (tooMuch
              ? isOut
                ? `You can remove at most ${available}.`
                : `Only ${freeSpace} unit(s) of free space.`
              : undefined)
          }
        />

        <Input
          label="Note (optional)"
          name="note"
          placeholder={isOut ? "e.g. Sold to customer" : "e.g. New delivery from supplier"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {saveError && <p className="text-sm text-danger">{saveError}</p>}
      </div>
    </Modal>
  );
}
