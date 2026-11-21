"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { needsAttention } from "@/lib/stock";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/inventory", label: "Inventory" },
];

export default function Sidebar() {
  const pathname = usePathname();
  // Number of active products that are low or out of stock
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const count = snapshot.docs.filter((d) =>
          needsAttention(d.data() as Parameters<typeof needsAttention>[0])
        ).length;
        setAlertCount(count);
      },
      (err) => console.error(err)
    );
    return () => unsubscribe();
  }, []);

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-primary text-white md:flex">
      <div className="border-b border-white/10 px-6 py-6 text-xl font-semibold tracking-wide">
        <span className="text-accent">INVY</span>
        <span>STOCK</span>
      </div>

      <nav className="flex flex-col gap-2 p-4">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between rounded-lg border-l-4 px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "border-accent bg-primary-dark"
                  : "border-transparent hover:bg-primary-dark/60"
              }`}
            >
              <span>{link.label}</span>
              {link.href === "/inventory" && alertCount > 0 && (
                <span
                  title={`${alertCount} product(s) low or out of stock`}
                  className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white"
                >
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}