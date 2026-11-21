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

export default function StockMovementModal({
  open,
  onClose,
  type,
  products,
}: {
  open: boolean;
  onClose: () => void;
  type: TransactionType;
  products: Product[]; // active products only
}) {
  const { user, profile } = useAuth();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ productId?: string; quantity?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isOut = type === "out";
  const selected = products.find((p) => p.id === productId);
  const qty = Number(quantity);

  // Live check for Stock Out: block quantities bigger than the available stock
  const tooMuch = isOut && !!selected && quantity !== "" && qty > selected.currentStock;

  async function handleSave() {
    const newErrors: { productId?: string; quantity?: string } = {};
    if (!productId) newErrors.productId = "Please choose a product.";
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
          {selected && (
            <p className="mt-1 text-sm text-gray-600">
              Available: <strong>{selected.currentStock}</strong>
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
            (tooMuch ? `You can remove at most ${selected?.currentStock}.` : undefined)
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
