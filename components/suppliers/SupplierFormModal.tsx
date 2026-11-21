"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { SupplierFormData } from "@/types/supplier";

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

export default function SupplierFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<SupplierFormData>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Update one field, e.g. updateField("email", "a@b.com")
  function updateField(field: keyof SupplierFormData, value: string) {
    setForm({ ...form, [field]: value });
  }

  function handleClose() {
    setForm(emptyForm);
    setErrors({});
    setSaveError("");
    onClose();
  }

  async function handleSave() {
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    setSaveError("");
    try {
      await addDoc(collection(db, "suppliers"), {
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        createdAt: serverTimestamp(),
      });
      handleClose();
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
      onClose={handleClose}
      title="Add Supplier"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
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
