"use client";

// TEMPORARY page to preview UI components. Will be deleted after Step 5c.

import { useState } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Table, { Column } from "@/components/ui/Table";

// Fake data, only for this test page
type DemoProduct = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minimumStock: number;
  status: "active" | "inactive";
};

const demoProducts: DemoProduct[] = [
  { id: "1", name: "Wireless Mouse", sku: "SKU-001", stock: 50, minimumStock: 10, status: "active" },
  { id: "2", name: "USB Cable", sku: "SKU-002", stock: 5, minimumStock: 10, status: "active" },
  { id: "3", name: "Keyboard", sku: "SKU-003", stock: 0, minimumStock: 5, status: "active" },
  { id: "4", name: "Old Monitor", sku: "SKU-004", stock: 3, minimumStock: 2, status: "inactive" },
];

const demoColumns: Column<DemoProduct>[] = [
  { header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
  { header: "SKU", render: (p) => p.sku },
  { header: "Stock", render: (p) => p.stock },
  {
    header: "Status",
    render: (p) =>
      p.status === "inactive" ? (
        <Badge color="gray">Inactive</Badge>
      ) : p.stock === 0 ? (
        <Badge color="red">Out of Stock</Badge>
      ) : p.stock <= p.minimumStock ? (
        <Badge color="yellow">Low Stock</Badge>
      ) : (
        <Badge color="green">In Stock</Badge>
      ),
  },
];

export default function UiTestPage() {
  const [name, setName] = useState("");
  const [clicks, setClicks] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalSku, setModalSku] = useState("");
  const [errors, setErrors] = useState<{ name?: string; sku?: string }>({});

  function closeModal() {
    setModalOpen(false);
    setModalName("");
    setModalSku("");
    setErrors({});
  }

  function handleSave() {
    const newErrors: { name?: string; sku?: string } = {};
    if (!modalName.trim()) newErrors.name = "Name is required.";
    if (!modalSku.trim()) newErrors.sku = "SKU is required.";

    setErrors(newErrors);

    // Stop here if there is any error (keep the modal open)
    if (Object.keys(newErrors).length > 0) return;

    alert(`Saved: ${modalName} (${modalSku})`);
    closeModal();
  }

  return (
    <>
      <Header title="UI Test" />
      <main className="space-y-6">
        <section className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setClicks(clicks + 1)}>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
          <p className="text-sm text-gray-500">Primary clicked {clicks} times</p>
        </section>

        <section className="max-w-md space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Inputs</h2>
          <Input
            label="Product Name"
            name="productName"
            placeholder="Enter product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="SKU"
            name="sku"
            placeholder="e.g. SKU-001"
            error="SKU already exists."
          />
          <Input label="Price" name="price" type="number" placeholder="0.00" />
        </section>

        <section className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge color="green">In Stock</Badge>
            <Badge color="yellow">Low Stock</Badge>
            <Badge color="red">Out of Stock</Badge>
            <Badge color="gray">Inactive</Badge>
          </div>
        </section>

        <section className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Modal</h2>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Table</h2>
          <Table
            columns={demoColumns}
            data={demoProducts}
            getRowKey={(p) => p.id}
            rowClassName={(p) => (p.status === "inactive" ? "opacity-50" : "")}
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Empty Table</h2>
          <Table
            columns={demoColumns}
            data={[]}
            getRowKey={(p) => p.id}
            emptyMessage="No products yet."
          />
        </section>
      </main>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Add Product"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            name="modalName"
            placeholder="Product name"
            value={modalName}
            onChange={(e) => setModalName(e.target.value)}
            error={errors.name}
          />
          <Input
            label="SKU"
            name="modalSku"
            placeholder="e.g. SKU-001"
            value={modalSku}
            onChange={(e) => setModalSku(e.target.value)}
            error={errors.sku}
          />
        </div>
      </Modal>
    </>
  );
}
