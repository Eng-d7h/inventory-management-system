"use client";

// TEMPORARY page to preview UI components. Will be deleted after Step 5c.

import { useState } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

export default function UiTestPage() {
  const [name, setName] = useState("");
  const [clicks, setClicks] = useState(0);

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
      </main>
    </>
  );
}
