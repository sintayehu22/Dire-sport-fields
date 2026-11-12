"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { adminAuth } from "@/src/lib/firebase";
import { verifyAdminUser } from "@/src/lib/admin";

function friendlyAuthError(error) {
  const code = String(error?.code ?? "");
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "The email or password is incorrect.";
  }
  if (code.includes("too-many-requests")) return "Too many attempts. Wait a moment and try again.";
  if (code.includes("network-request-failed")) return "Network error. Check your connection and try again.";
  return error?.message ?? "Administrator sign-in failed.";
}

export default function AdminSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(adminAuth ? "" : "Firebase is not configured.");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!adminAuth) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (adminAuth.currentUser) await signOut(adminAuth);
      await setPersistence(
        adminAuth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      );
      const credential = await signInWithEmailAndPassword(
        adminAuth,
        email.trim().toLowerCase(),
        password,
      );
      if (!(await verifyAdminUser(credential.user, true))) {
        await signOut(adminAuth);
        throw new Error("This account is valid, but it has not been granted the admin role.");
      }
      setPassword("");
      router.replace("/admin/dashboard");
    } catch (nextError) {
      setError(friendlyAuthError(nextError));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!adminAuth || !email.trim()) {
      setError("Enter the administrator email address first.");
      return;
    }
    setResetting(true);
    setError("");
    setNotice("");
    try {
      await sendPasswordResetEmail(adminAuth, email.trim().toLowerCase());
      setNotice("If that administrator account exists, Firebase sent a password reset email.");
    } catch (nextError) {
      setError(friendlyAuthError(nextError));
    } finally {
      setResetting(false);
    }
  }

  const inputClass =
    "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#07110d] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10";

  return (
    <main className="grid min-h-screen bg-[#07110d] text-slate-100 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/[0.07] bg-[#0a1712] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_10%,rgba(52,211,153,.28),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(16,185,129,.16),transparent_28%)]" />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-xs font-black text-[#07110d]">
              DS
            </span>
            <span>
              <span className="block text-base font-extrabold text-white">Dire Sport Fields</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                Administration
              </span>
            </span>
          </Link>
        </div>
        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">Operations center</p>
          <h1 className="mt-4 text-5xl font-black leading-[1.08] tracking-tight text-white">
            Run the platform from one secure workspace.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
            Manage real facilities, reservations, verified payments, customers, feedback, and platform activity without entering the customer interface.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-300">
            {["Firestore role authorization", "Server-validated actions", "Immutable activity history", "Live Firestore records"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-600">Authorized Dire Sport Fields staff only</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xs font-black text-[#07110d]">DS</span>
              <span className="font-extrabold text-white">Dire Sport Fields Admin</span>
            </Link>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Secure sign in</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Welcome back</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Use an Email/Password Firebase account with an active administrator record in the secure <code className="text-emerald-300">users</code> collection.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold text-slate-200">
              Administrator email
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-200">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className={inputClass}
              />
            </label>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 accent-emerald-400"
                />
                Keep this admin signed in
              </label>
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="text-xs font-bold text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
              >
                {resetting ? "Sending…" : "Forgot password?"}
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !adminAuth}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-400 px-5 text-sm font-extrabold text-[#07110d] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Verifying administrator…" : "Open admin dashboard"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-slate-600">
            Customer accounts and anonymous booking sessions use a separate Firebase Auth instance and are not changed by this sign-in.
          </p>
        </div>
      </section>
    </main>
  );
}
