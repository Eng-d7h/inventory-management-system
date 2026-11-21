"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Table, { Column } from "@/components/ui/Table";
import CategoriesModal from "@/components/products/CategoriesModal";
import ProductFormModal from "@/components/products/ProductFormModal";
import { Category } from "@/types/category";
import { Supplier } from "@/types/supplier";
import { Product } from "@/types/product";

// Simple columns for now. Step P3 adds names, badges and more.
const columns: Column<Product>[] = [
  { header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
  { header: "SKU", render: (p) => p.sku },
  { header: "Stock", render: (p) => p.currentStock },
  { header: "Status", render: (p) => p.status },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

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
            <Button onClick={() => setFormOpen(true)}>+ Add Product</Button>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {loading ? (
          <p className="text-gray-500">Loading products...</p>
        ) : (
          <Table
            columns={columns}
            data={products}
            getRowKey={(p) => p.id}
            emptyMessage="No products yet. Click “Add Product” to create one."
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
        />
      )}
    </>
  );
}
