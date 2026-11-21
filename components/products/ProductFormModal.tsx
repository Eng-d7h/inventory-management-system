"use client";

import { useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Category } from "@/types/category";
import { Supplier } from "@/types/supplier";
import { ProductStatus } from "@/types/product";

// Numbers are kept as text while typing, then converted on save
type FormData = {
  name: string;
  sku: string;
  categoryId: string;
  supplierId: string;
  purchasePrice: string;
  sellingPrice: string;
  minimumStock: string;
  initialStock: string;
  status: ProductStatus;
};

type Errors = Partial<Record<keyof FormData, string>>;

const emptyForm: FormData = {
  name: "",
  sku: "",
  categoryId: "",
  supplierId: "",
  purchasePrice: "",
  sellingPrice: "",
  minimumStock: "0",
  initialStock: "0",
  status: "active",
};

// SKU is saved in UPPERCASE without spaces, so "sku-1" and "SKU-1" are the same
function normalizeSku(sku: string) {
  return sku.trim().toUpperCase();
}

function isPrice(value: string) {
  return value.trim() !== "" && Number(value) >= 0;
}

function isWholeNumber(value: string) {
  return Number.isInteger(Number(value)) && Number(value) >= 0 && value.trim() !== "";
}

function validate(form: FormData): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.sku.trim()) errors.sku = "SKU is required.";
  if (!form.categoryId) errors.categoryId = "Please choose a category.";
  if (!form.supplierId) errors.supplierId = "Please choose a supplier.";
  if (!isPrice(form.purchasePrice)) errors.purchasePrice = "Enter a price of 0 or more.";
  if (!isPrice(form.sellingPrice)) errors.sellingPrice = "Enter a price of 0 or more.";
  if (!isWholeNumber(form.minimumStock)) errors.minimumStock = "Enter a whole number (0 or more).";
  if (!isWholeNumber(form.initialStock)) errors.initialStock = "Enter a whole number (0 or more).";
  return errors;
}

export default function ProductFormModal({
  open,
  onClose,
  categories,
  suppliers,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  suppliers: Supplier[];
}) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function updateField(field: keyof FormData, value: string) {
    setForm({ ...form, [field]: value });
  }

  // Warning only (decision 10): selling below purchase price is allowed
  const showPriceWarning =
    isPrice(form.purchasePrice) &&
    isPrice(form.sellingPrice) &&
    Number(form.sellingPrice) < Number(form.purchasePrice);

  async function handleSave() {
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !user) return;

    setSaving(true);
    setSaveError("");
    try {
      const sku = normalizeSku(form.sku);

      // 1) SKU must be unique (decision 8)
      const existing = await getDocs(
        query(collection(db, "products"), where("sku", "==", sku), limit(1))
      );
      if (!existing.empty) {
        setErrors({ sku: "This SKU is already used by another product." });
        return;
      }

      const initialStock = Number(form.initialStock);
      const name = form.name.trim();

      // 2) A batch saves everything together: all writes succeed, or none do
      const batch = writeBatch(db);
      const productRef = doc(collection(db, "products")); // new id

      batch.set(productRef, {
        name,
        sku,
        categoryId: form.categoryId,
        supplierId: form.supplierId,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        currentStock: initialStock,
        minimumStock: Number(form.minimumStock),
        status: form.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3) Initial stock > 0 creates an "in" transaction (decision 9)
      if (initialStock > 0) {
        batch.set(doc(collection(db, "inventoryTransactions")), {
          productId: productRef.id,
          productName: name,
          type: "in",
          quantity: initialStock,
          stockBefore: 0,
          stockAfter: initialStock,
          note: "Initial stock",
          createdBy: user.uid,
          createdByName: profile?.name ?? user.email ?? "Unknown",
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
      onClose();
    } catch (err) {
      console.error(err);
      setSaveError("Could not save the product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Product"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Name"
            name="name"
            placeholder="e.g. Wireless Mouse"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={errors.name}
          />
        </div>
        <Input
          label="SKU"
          name="sku"
          placeholder="e.g. MOU-001"
          value={form.sku}
          onChange={(e) => updateField("sku", e.target.value)}
          error={errors.sku}
        />
        <Select
          label="Status"
          name="status"
          value={form.status}
          onChange={(e) => updateField("status", e.target.value)}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <Select
          label="Category"
          name="categoryId"
          value={form.categoryId}
          onChange={(e) => updateField("categoryId", e.target.value)}
          error={errors.categoryId}
          placeholder={categories.length ? "Choose a category" : "No categories yet"}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          label="Supplier"
          name="supplierId"
          value={form.supplierId}
          onChange={(e) => updateField("supplierId", e.target.value)}
          error={errors.supplierId}
          placeholder={suppliers.length ? "Choose a supplier" : "No suppliers yet"}
          options={suppliers.map((s) => ({ value: s.id, label: s.companyName }))}
        />
        <Input
          label="Purchase Price"
          name="purchasePrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.purchasePrice}
          onChange={(e) => updateField("purchasePrice", e.target.value)}
          error={errors.purchasePrice}
        />
        <Input
          label="Selling Price"
          name="sellingPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.sellingPrice}
          onChange={(e) => updateField("sellingPrice", e.target.value)}
          error={errors.sellingPrice}
        />
        {showPriceWarning && (
          <p className="rounded-lg bg-warning/15 px-3 py-2 text-sm text-yellow-800 sm:col-span-2">
            ⚠️ Selling price is lower than purchase price.
          </p>
        )}
        <Input
          label="Minimum Stock"
          name="minimumStock"
          type="number"
          min="0"
          step="1"
          value={form.minimumStock}
          onChange={(e) => updateField("minimumStock", e.target.value)}
          error={errors.minimumStock}
        />
        <Input
          label="Initial Stock"
          name="initialStock"
          type="number"
          min="0"
          step="1"
          value={form.initialStock}
          onChange={(e) => updateField("initialStock", e.target.value)}
          error={errors.initialStock}
        />
        {saveError && <p className="text-sm text-danger sm:col-span-2">{saveError}</p>}
      </div>
    </Modal>
  );
}
