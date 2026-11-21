"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Table, { Column } from "@/components/ui/Table";
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

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setFormOpen(true);
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
        <div className="space-y-0.5 text-sm">
          <p>✉️ {s.email}</p>
          <p>📞 {s.phone}</p>
        </div>
      ),
    },
    {
      header: "Address",
      render: (s) => s.address || <span className="text-gray-400">-</span>,
    },
    {
      header: "Actions",
      className: "text-right",
      render: (s) => (
        <Button variant="secondary" onClick={() => openEdit(s)}>
          Edit
        </Button>
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

  return (
    <>
      <Header title="Suppliers" />
      <main className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Suppliers</h1>
          <Button onClick={openAdd}>+ Add Supplier</Button>
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
    </>
  );
}
