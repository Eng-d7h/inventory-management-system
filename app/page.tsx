"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

export default function HomePage() {
  const { profile, user } = useAuth();

  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">
          Welcome, {profile?.name ?? user?.email}
        </h1>
        <p className="text-gray-500">Role: {profile?.role ?? "-"}</p>
        <button
          type="button"
          onClick={() => signOut(auth)}
          className="rounded-lg bg-slate-800 px-6 py-2 text-white hover:bg-slate-700"
        >
          Logout
        </button>
      </main>
    </ProtectedRoute>
  );
}