"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function Header({ title }: { title: string }) {
  const { profile, user } = useAuth();

  const displayName = profile?.name ?? user?.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-sm">
      <h2 className="text-lg font-medium text-gray-800">{title}</h2>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{displayName}</p>
          <p className="text-xs capitalize text-gray-500">
            {profile?.role ?? "-"}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
          {initials}
        </div>

        <button
          type="button"
          onClick={() => signOut(auth)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}