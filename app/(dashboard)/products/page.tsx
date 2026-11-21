"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import CategoriesModal from "@/components/products/CategoriesModal";
import { Category } from "@/types/category";

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    // Listen to categories, sorted A to Z
    const q = query(collection(db, "categories"), orderBy("name"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCategories(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)
        );
      },
      (err) => console.error(err)
    );

    return () => unsubscribe();
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
          </div>
        </div>

        <p className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
          Products table coming in the next step. Categories: {categories.length}
        </p>
      </main>

      <CategoriesModal
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={categories}
      />
    </>
  );
}
