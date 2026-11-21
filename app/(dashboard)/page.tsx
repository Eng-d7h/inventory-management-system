"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getStockStatus, needsAttention, stockStatusInfo } from "@/lib/stock";
import { Product } from "@/types/product";
import { InventoryTransaction } from "@/types/inventory";

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${accent}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-800">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierCount, setSupplierCount] = useState(0);
  const [recent, setRecent] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    const unsubSuppliers = onSnapshot(
      collection(db, "suppliers"),
      (snapshot) => setSupplierCount(snapshot.size),
      (err) => console.error(err)
    );

    // Only the 5 newest movements
    const unsubRecent = onSnapshot(
      query(collection(db, "inventoryTransactions"), orderBy("createdAt", "desc"), limit(5)),
      (snapshot) =>
        setRecent(
          snapshot.docs.map(
            (d) =>
              ({
                id: d.id,
                ...d.data({ serverTimestamps: "estimate" }),
              }) as InventoryTransaction
          )
        ),
      (err) => console.error(err)
    );

    return () => {
      unsubProducts();
      unsubSuppliers();
      unsubRecent();
    };
  }, []);

  // Calculations (nothing here is stored in the database)
  const activeProducts = products.filter((p) => p.status === "active");
  const inventoryValue = activeProducts.reduce(
    (sum, p) => sum + p.currentStock * p.purchasePrice,
    0
  );
  const lowStockItems = activeProducts
    .filter(needsAttention)
    .sort((a, b) => a.currentStock - b.currentStock); // emptiest first

  return (
    <>
      <Header title="Dashboard" />
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, {profile?.name ?? user?.email}
        </h1>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Products" value={activeProducts.length} accent="border-primary" />
              <StatCard label="Inventory Value" value={formatMoney(inventoryValue)} accent="border-accent" />
              <StatCard label="Low Stock" value={lowStockItems.length} accent="border-warning" />
              <StatCard label="Total Suppliers" value={supplierCount} accent="border-primary-dark" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Transactions */}
              <section className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">Recent Transactions</h2>
                  <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
                    View all
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">No stock movements yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recent.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">{t.productName}</p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(t.createdAt)} · {t.createdByName}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              t.type === "in" ? "text-green-700" : "text-danger"
                            }`}
                          >
                            {t.type === "in" ? "+" : "−"}
                            {t.quantity}
                          </span>
                          {t.type === "in" ? (
                            <Badge color="green">IN</Badge>
                          ) : (
                            <Badge color="red">OUT</Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Low Stock Items */}
              <section className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">Low Stock Items</h2>
                  <Link href="/inventory" className="text-sm font-medium text-primary hover:underline">
                    Go to Inventory
                  </Link>
                </div>
                {lowStockItems.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">
                    All good! No products are low or out of stock.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {lowStockItems.map((p) => {
                      const info = stockStatusInfo[getStockStatus(p.currentStock, p.minimumStock)];
                      return (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">{p.name}</p>
                            <p className="font-mono text-xs text-gray-500">{p.sku}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-sm text-gray-600">
                              <strong className="text-gray-800">{p.currentStock}</strong> / min{" "}
                              {p.minimumStock}
                            </span>
                            <Badge color={info.color}>{info.label}</Badge>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}
