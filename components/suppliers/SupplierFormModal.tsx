"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Supplier, SupplierFormData } from "@/types/supplier";

const emptyForm: SupplierFormData = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
};

type Errors = Partial<Record<keyof SupplierFormData, string>>;

function validate(form: SupplierFormData): Errors {
  const errors: Errors = {};
  if (!form.companyName.trim()) errors.companyName = "Company name is required.";
  if (!form.contactPerson.trim()) errors.contactPerson = "Contact person is required.";
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = "Invalid email address.";
  }
  if (!form.phone.trim()) errors.phone = "Phone is required.";
  return errors;
}

// If "supplier" is given, the form is in Edit mode. Otherwise it is in Add mode.
export default function SupplierFormModal({
  open,
  onClose,
  supplier,
}: {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}) {
  const isEdit = !!supplier;

  // Start with the supplier's current values (Edit) or empty fields (Add)
  const [form, setForm] = useState<SupplierFormData>(
    supplier
      ? {
          companyName: supplier.companyName,
          contactPerson: supplier.contactPerson,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address ?? "",
        }
      : emptyForm
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Update one field, e.g. updateField("email", "a@b.com")
  function updateField(field: keyof SupplierFormData, value: string) {
    setForm({ ...form, [field]: value });
  }


  async function handleSave() {
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    setSaveError("");
    try {
      const data = {
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      if (supplier) {
        // Edit: update the existing document (createdAt stays the same)
        await updateDoc(doc(db, "suppliers", supplier.id), data);
      } else {
        // Add: create a new document
        await addDoc(collection(db, "suppliers"), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setSaveError("Could not save the supplier. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Supplier" : "Add Supplier"}
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
      <div className="space-y-4">
        <Input
          label="Company Name"
          name="companyName"
          placeholder="e.g. Tech Supplies Co."
          value={form.companyName}
          onChange={(e) => updateField("companyName", e.target.value)}
          error={errors.companyName}
        />
        <Input
          label="Contact Person"
          name="contactPerson"
          placeholder="e.g. John Smith"
          value={form.contactPerson}
          onChange={(e) => updateField("contactPerson", e.target.value)}
          error={errors.contactPerson}
        />
        <Input
          label="Phone"
          name="phone"
          type="tel"
          placeholder="e.g. +1 555 123 4567"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          error={errors.phone}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="e.g. contact@company.com"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          error={errors.email}
        />
        <Input
          label="Address (optional)"
          name="address"
          placeholder="e.g. 12 Main St, City"
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
        />
        {saveError && <p className="text-sm text-danger">{saveError}</p>}
      </div>
    </Modal>
  );
}
