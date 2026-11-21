"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Table, { Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CategoriesModal from "@/components/products/CategoriesModal";
import ProductFormModal from "@/components/products/ProductFormModal";
import { Category } from "@/types/category";
import { Supplier } from "@/types/supplier";
import { Product } from "@/types/product";
import { getStockStatus, stockStatusInfo } from "@/lib/stock";
import { formatMoney } from "@/lib/format";


export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  // The product being edited (null = adding a new one)
  const [editing, setEditing] = useState<Product | null>(null);
  // The product waiting for "Deactivate" confirmation
  const [deactivating, setDeactivating] = useState<Product | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Filter the list in the browser (no extra database reads)
  const searchText = search.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchText === "" ||
      p.name.toLowerCase().includes(searchText) ||
      p.sku.toLowerCase().includes(searchText);
    const matchesCategory = categoryFilter === "" || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Turn an id into a name, e.g. categoryId -> "Electronics"
  function categoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? "-";
  }

  function supplierName(id: string) {
    return suppliers.find((s) => s.id === id)?.companyName ?? "-";
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  // No hard delete (decision 6): we only switch status active <-> inactive
  async function changeStatus(product: Product, status: Product["status"]) {
    setStatusLoading(true);
    setStatusError("");
    try {
      await updateDoc(doc(db, "products", product.id), {
        status,
        updatedAt: serverTimestamp(),
      });
      setDeactivating(null);
    } catch (err) {
      console.error(err);
      setStatusError("Could not update the product. Please try again.");
    } finally {
      setStatusLoading(false);
    }
  }

  const columns: Column<Product>[] = [
    { header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
    { header: "SKU", render: (p) => <span className="font-mono text-xs">{p.sku}</span> },
    { header: "Category", render: (p) => categoryName(p.categoryId) },
    { header: "Supplier", render: (p) => supplierName(p.supplierId) },
    { header: "Buy", render: (p) => formatMoney(p.purchasePrice) },
    { header: "Sell", render: (p) => formatMoney(p.sellingPrice) },
    {
      header: "Stock",
      render: (p) => {
        const info = stockStatusInfo[getStockStatus(p.currentStock, p.minimumStock)];
        return (
          <div className="flex items-center gap-2">
            <span className="w-8 font-medium">{p.currentStock}</span>
            <Badge color={info.color}>{info.label}</Badge>
          </div>
        );
      },
    },
    {
      header: "Status",
      render: (p) =>
        p.status === "active" ? (
          <span className="text-sm text-gray-700">Active</span>
        ) : (
          <Badge color="gray">Inactive</Badge>
        ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => openEdit(p)}>
            Edit
          </Button>
          {p.status === "active" ? (
            <Button
              variant="danger"
              onClick={() => {
                setStatusError("");
                setDeactivating(p);
              }}
            >
              Deactivate
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => changeStatus(p, "active")}>
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    // Listen to 3 collections at once. Each returns an "unsubscribe" function.
    const unsubProducts = onSnapshot(
      query(collection(db, "products"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Could not load products.");
        setLoading(false);
      }
    );

    const unsubCategories = onSnapshot(
      query(collection(db, "categories"), orderBy("name")),
      (snapshot) =>
        setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)),
      (err) => console.error(err)
    );

    const unsubSuppliers = onSnapshot(
      query(collection(db, "suppliers"), orderBy("companyName")),
      (snapshot) =>
        setSuppliers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Supplier)),
      (err) => console.error(err)
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSuppliers();
    };
  }, []);

  return (
    <>
      <Header title="Products" />
      <main className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-800">Products</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCategoriesOpen(true)}>
              Manage Categories
            </Button>
            <Button onClick={openAdd}>+ Add Product</Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-80">
            <Input
              name="search"
              type="search"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sm:w-56">
            <Select
              name="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="All categories"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {statusError && !deactivating && (
          <p className="text-sm text-danger">{statusError}</p>
        )}

        {loading ? (
          <p className="text-gray-500">Loading products...</p>
        ) : (
          <Table
            columns={columns}
            data={filteredProducts}
            getRowKey={(p) => p.id}
            rowClassName={(p) => (p.status === "inactive" ? "opacity-50" : "")}
            emptyMessage={
              products.length === 0
                ? "No products yet. Click “Add Product” to create one."
                : "No products match your search."
            }
          />
        )}
      </main>

      <CategoriesModal
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={categories}
      />

      {/* Render only when open, so the form starts empty every time */}
      {formOpen && (
        <ProductFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          categories={categories}
          suppliers={suppliers}
          product={editing}
        />
      )}

      <ConfirmDialog
        open={!!deactivating}
        title="Deactivate Product"
        message={
          <p>
            Deactivate <strong>{deactivating?.name}</strong>? It will stay in the
            table (faded) but will be hidden from Stock In / Stock Out. You can
            activate it again at any time.
          </p>
        }
        confirmLabel="Deactivate"
        loadingLabel="Saving..."
        loading={statusLoading}
        error={statusError}
        onConfirm={() => deactivating && changeStatus(deactivating, "inactive")}
        onCancel={() => setDeactivating(null)}
      />
    </>
  );
}
