"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/inventory", label: "Inventory" },
];

export default function Sidebar() {
  const pathname = usePathname();

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
              className={`rounded-lg border-l-4 px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "border-accent bg-primary-dark"
                  : "border-transparent hover:bg-primary-dark/60"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}