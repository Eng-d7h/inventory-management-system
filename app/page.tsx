"use client";

import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function HomePage() {
  const { profile, user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Header title="Dashboard" />
          <main>
            <h1 className="text-2xl font-semibold">
              Welcome, {profile?.name ?? user?.email}
            </h1>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}