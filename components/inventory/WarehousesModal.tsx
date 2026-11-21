"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Pencil, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { Warehouse } from "@/types/warehouse";

type FormData = { name: string; location: string; capacity: string };
type Errors = Partial<Record<keyof FormData, string>>;

const emptyForm: FormData = { name: "", location: "", capacity: "" };

export default function WarehousesModal({
  open,
  onClose,
  warehouses,
}: {
  open: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
}) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  // Warehouse waiting for a second click to confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const editing = warehouses.find((w) => w.id === editingId);

  function startEdit(w: Warehouse) {
    setEditingId(w.id);
    setForm({ name: w.name, location: w.location, capacity: String(w.capacity) });
    setErrors({});
    setMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  }

  function validate(): Errors {
    const e: Errors = {};
    const name = form.name.trim();
    if (!name) e.name = "Name is required.";
    else if (
      warehouses.some(
        (w) => w.id !== editingId && w.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      e.name = "A warehouse with this name already exists.";
    }
    if (!form.location.trim()) e.location = "Location is required.";
    const cap = Number(form.capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      e.capacity = "Enter a whole number greater than 0.";
    } else if (editing && cap < editing.usedUnits) {
      e.capacity = `Capacity cannot be less than the stored units (${editing.usedUnits}).`;
    }
    return e;
  }

  async function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    setMessage("");
    try {
      const data = {
        name: form.name.trim(),
        location: form.location.trim(),
        capacity: Number(form.capacity),
      };
      if (editingId) {
        await updateDoc(doc(db, "warehouses", editingId), data);
      } else {
        await addDoc(collection(db, "warehouses"), {
          ...data,
          usedUnits: 0,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      setMessage("Could not save the warehouse. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(w: Warehouse) {
    // Only empty warehouses can be deleted
    if (w.usedUnits > 0) {
      setMessage(`"${w.name}" still has ${w.usedUnits} unit(s) and cannot be deleted.`);
      return;
    }
    // First click asks, second click deletes
    if (confirmDeleteId !== w.id) {
      setConfirmDeleteId(w.id);
      setMessage(`Click delete again to remove "${w.name}".`);
      return;
    }
    try {
      await deleteDoc(doc(db, "warehouses", w.id));
      setConfirmDeleteId(null);
      setMessage("");
      if (editingId === w.id) resetForm();
    } catch (err) {
      console.error(err);
      setMessage("Could not delete the warehouse. Please try again.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Warehouses"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700">
            {editingId ? `Edit: ${editing?.name}` : "Add a new warehouse"}
          </p>
          <Input
            label="Name"
            name="warehouseName"
            placeholder="e.g. Main Warehouse"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="Location"
            name="warehouseLocation"
            placeholder="e.g. New York"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            error={errors.location}
          />
          <Input
            label="Capacity (units)"
            name="warehouseCapacity"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 10000"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            error={errors.capacity}
          />
          <div className="flex justify-end gap-2">
            {editingId && (
              <Button variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel edit
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add warehouse"}
            </Button>
          </div>
        </div>

        {message && <p className="text-sm text-danger">{message}</p>}

        {warehouses.length === 0 ? (
          <p className="py-2 text-center text-sm text-gray-500">No warehouses yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {warehouses.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{w.name}</p>
                  <p className="text-xs text-gray-500">
                    {w.location} · {w.usedUnits.toLocaleString()} /{" "}
                    {w.capacity.toLocaleString()} units
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconButton icon={Pencil} label="Edit" color="primary" onClick={() => startEdit(w)} />
                  <IconButton
                    icon={Trash2}
                    label={confirmDeleteId === w.id ? "Click again to delete" : "Delete"}
                    color="danger"
                    onClick={() => handleDelete(w)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
