"use client";

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";


export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
   const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);


  async function handleSignUp() {
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        name: name.trim(),
        email: email.trim(),
        role: "admin",
        createdAt: serverTimestamp(),
      });

      router.push("/");
        } catch (err: unknown) {
      console.error(err);
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex min-h-screen">
      {/* Left side: form */}
      <section className="flex w-full flex-col justify-center px-8 md:w-1/2 md:px-24">
        <h1 className="mb-8 text-3xl font-semibold">Create an account</h1>

        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-black outline-none focus:border-blue-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-black outline-none focus:border-blue-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-16 text-black outline-none focus:border-blue-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="w-full rounded-lg bg-slate-800 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-700">
              Log in
            </Link>
          </p>
        </div>
      </section>

      {/* Right side: branding (hidden on mobile) */}
      <section className="hidden flex-col items-center justify-center bg-slate-800 px-12 text-center text-white md:flex md:w-1/2">
        <h2 className="mb-3 text-2xl font-semibold">
          A simple way to manage your inventory
        </h2>
        <p className="text-slate-300">
          Track products, suppliers, and stock movements in one place.
        </p>
      </section>
    </main>
  );
}