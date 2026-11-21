"use client";

import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";

export default function DashboardPage() {
  const { profile, user } = useAuth();

  return (
    <>
      <Header title="Dashboard" />
      <main>
        <h1 className="text-2xl font-semibold">
          Welcome, {profile?.name ?? user?.email}
        </h1>
      </main>
    </>
  );
}
