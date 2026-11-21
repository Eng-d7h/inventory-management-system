"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import Table, { Column } from "@/components/ui/Table";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SupplierFormModal from "@/components/suppliers/SupplierFormModal";
import { Supplier } from "@/types/supplier";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  // The supplier being edited, or null when adding a new one
  const [editing, setEditing] = useState<Supplier | null>(null);

  // Number of products for each supplier: { supplierId: count }
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  // The supplier the user wants to delete (null = dialog closed)
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setFormOpen(true);
  }

  function openDelete(supplier: Supplier) {
    setDeleteError("");
    setDeleting(supplier);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      // Check the database again right before deleting (safety check)
      const linked = await getDocs(
        query(
          collection(db, "products"),
          where("supplierId", "==", deleting.id),
          limit(1)
        )
      );
      if (!linked.empty) {
        setDeleteError("This supplier has products and cannot be deleted.");
        return;
      }

      await deleteDoc(doc(db, "suppliers", deleting.id));
      setDeleting(null);
    } catch (err) {
      console.error(err);
      setDeleteError("Could not delete the supplier. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: Column<Supplier>[] = [
    {
      header: "Company",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(s.companyName)}
          </div>
          <div>
            <p className="font-medium text-gray-800">{s.companyName}</p>
            <p className="text-xs text-gray-500">{s.contactPerson}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      render: (s) => (
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" /> {s.email}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" /> {s.phone}
          </p>
        </div>
      ),
    },
    {
      header: "Address",
      render: (s) => s.address || <span className="text-gray-400">-</span>,
    },
    {
      header: "Products",
      render: (s) => productCounts[s.id] ?? 0,
    },
    {
      header: "Actions",
      className: "text-right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={Pencil} label="Edit" color="primary" onClick={() => openEdit(s)} />
          <IconButton icon={Trash2} label="Delete" color="danger" onClick={() => openDelete(s)} />
        </div>
      ),
    },
  ];

  useEffect(() => {
    // Listen to the suppliers collection: the table updates automatically
    const q = query(collection(db, "suppliers"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSuppliers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Supplier)
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Could not load suppliers.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Listen to products and count them per supplier (calculated, not stored)
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.docs.forEach((d) => {
          const supplierId = d.data().supplierId as string | undefined;
          if (supplierId) counts[supplierId] = (counts[supplierId] ?? 0) + 1;
        });
        setProductCounts(counts);
      },
      (err) => console.error(err)
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Header title="Suppliers" />
      <main className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Suppliers</h1>
          <Button onClick={openAdd} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {loading ? (
          <p className="text-gray-500">Loading suppliers...</p>
        ) : (
          <Table
            columns={columns}
            data={suppliers}
            getRowKey={(s) => s.id}
            emptyMessage="No suppliers yet. Click “Add Supplier” to create one."
          />
        )}
      </main>

      {/* Render the form only when open, so it starts fresh every time */}
      {formOpen && (
        <SupplierFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          supplier={editing}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete Supplier"
        message={
          deleting && (productCounts[deleting.id] ?? 0) > 0 ? (
            <p>
              <strong>{deleting.companyName}</strong> has{" "}
              {productCounts[deleting.id]} product(s). Move or remove them
              first; a supplier with products cannot be deleted.
            </p>
          ) : (
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleting?.companyName}</strong>? This cannot be undone.
            </p>
          )
        }
        loading={deleteLoading}
        confirmDisabled={!!deleting && (productCounts[deleting.id] ?? 0) > 0}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
