"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Category } from "@/types/category";

export default function CategoriesModal({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const trimmed = name.trim();
    setError("");

    if (!trimmed) {
      setError("Category name is required.");
      return;
    }

    // No duplicates, ignoring upper/lower case ("Food" = "food")
    const exists = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError("This category already exists.");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "categories"), {
        name: trimmed,
        createdAt: serverTimestamp(),
      });
      setName("");
    } catch (err) {
      console.error(err);
      setError("Could not add the category. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Categories"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {/* A <form> lets the user press Enter to add */}
        <form
          className="flex items-start gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <div className="flex-1">
            <Input
              name="categoryName"
              placeholder="New category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={error}
            />
          </div>
          <Button type="submit" disabled={saving} className="py-2.5">
            {saving ? "Adding..." : "Add"}
          </Button>
        </form>

        {categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            No categories yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {categories.map((c) => (
              <li key={c.id} className="px-4 py-2.5 text-sm text-gray-700">
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
