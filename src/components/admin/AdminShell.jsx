"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { adminAuth } from "@/src/lib/firebase";
import { verifyAdminUser } from "@/src/lib/admin";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin/dashboard", icon: "grid" },
  { label: "Bookings", href: "/admin/bookings", icon: "calendar" },
  { label: "Facilities", href: "/admin/facilities", icon: "facility" },
  { label: "Facility requests", href: "/admin/facility-requests", icon: "request" },
  { label: "Payments", href: "/admin/payments", icon: "payment" },
  { label: "Customers", href: "/admin/customers", icon: "users" },
  { label: "Reviews & feedback", href: "/admin/reviews", icon: "review" },
  { label: "Reports", href: "/admin/reports", icon: "chart" },
  { label: "Notifications", href: "/admin/notifications", icon: "bell" },
  { label: "Activity log", href: "/admin/activity-log", icon: "activity" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

const ICON_PATHS = {
  grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
  facility: "M3 19h18M5 19V8l7-4 7 4v11M9 19v-5h6v5M8 9h.01M12 9h.01M16 9h.01",
  request: "M12 5v14m-7-7h14M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z",
  payment: "M3 6h18v12H3V6Zm0 4h18M7 15h4",
  users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-2-11.96a4 4 0 0 1 0 7.75",
  review: "m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 3Z",
  chart: "M4 20V10m6 10V4m6 16v-7m5 7H2",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8Zm-8 12h4",
  activity: "M4 4h16v16H4V4Zm3 5h10M7 13h6M7 17h4",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6-1.4 1.4M7.4 16.6 6 18m12 0-1.4-1.4M7.4 7.4 6 6",
};

function NavIcon({ name }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0">
      <path
        d={ICON_PATHS[name]}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FullPageStatus({ title, message, error = false }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07110d] px-5 text-slate-100">
      <div className="max-w-md rounded-2xl border border-white/10 bg-[#0d1c16] p-7 text-center shadow-2xl">
        <span
          className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black ${
            error ? "bg-rose-400/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300"
          }`}
        >
          DS
        </span>
        <h1 className="mt-4 text-lg font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSignInPage = pathname === "/admin/sign-in";
  const [authState, setAuthState] = useState(adminAuth ? "checking" : "configuration-error");
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!adminAuth) return undefined;
    let active = true;
    return onAuthStateChanged(adminAuth, async (nextUser) => {
      if (!active) return;
      if (!nextUser) {
        setUser(null);
        setAuthState("unauthenticated");
        return;
      }
      try {
        const allowed = await verifyAdminUser(nextUser, true);
        if (!active) return;
        setUser(allowed ? nextUser : null);
        setAuthState(allowed ? "authorized" : "forbidden");
        setAuthError(
          allowed
            ? ""
            : "This Firebase account does not have an active administrator record.",
        );
      } catch (error) {
        if (!active) return;
        setUser(null);
        setAuthState("error");
        setAuthError(error?.message ?? "Admin access could not be verified.");
      }
    });
  }, []);

  useEffect(() => {
    if (isSignInPage && authState === "authorized") {
      router.replace("/admin/dashboard");
    } else if (!isSignInPage && ["unauthenticated", "forbidden"].includes(authState)) {
      router.replace("/admin/sign-in");
    }
  }, [authState, isSignInPage, router]);

  async function handleSignOut() {
    if (!adminAuth) return;
    await signOut(adminAuth);
    router.replace("/admin/sign-in");
  }

  if (isSignInPage) {
    if (authState === "authorized" || authState === "checking") {
      return <FullPageStatus title="Checking administrator access" message="Verifying the secure admin session…" />;
    }
    return children;
  }

  if (authState === "configuration-error") {
    return (
      <FullPageStatus
        error
        title="Firebase is not configured"
        message="Add the existing Firebase web configuration to .env.local. No project has been replaced or created."
      />
    );
  }
  if (authState === "error") {
    return <FullPageStatus error title="Access check failed" message={authError} />;
  }
  if (authState !== "authorized") {
    return <FullPageStatus title="Opening the admin workspace" message="Verifying role and permissions…" />;
  }

  const activeItem = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <div className="min-h-screen bg-[#07110d] text-slate-100">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/[0.08] bg-[#0a1712] shadow-2xl transition-transform duration-200 lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[4.5rem] items-center justify-between border-b border-white/[0.08] px-5">
          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-xs font-black tracking-tight text-[#07110d]">
              DS
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-white">Dire Sport Fields</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                Admin workspace
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Administrator navigation">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
            Platform management
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = activeItem?.href === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-semibold transition ${
                    active
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : "border-transparent text-slate-400 hover:border-white/[0.07] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/[0.08] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.035] p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-black uppercase text-emerald-300">
              {(user?.displayName || user?.email || "A").slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-white">
                {user?.displayName || "Administrator"}
              </span>
              <span className="block truncate text-[10px] text-slate-500">{user?.email}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 text-xs font-bold text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-200"
          >
            Sign out of admin
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#07110d]/90 backdrop-blur-xl">
          <div className="flex h-[4.5rem] items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-xl border border-white/10 p-2.5 text-slate-300 hover:bg-white/5 lg:hidden"
                aria-label="Open admin navigation"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{activeItem?.label ?? "Administration"}</p>
                <p className="hidden text-[11px] text-slate-500 sm:block">Secure operations console</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[11px] font-bold text-emerald-200 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                 Admin role verified
              </span>
              <Link
                href="/"
                className="inline-flex min-h-9 items-center rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 transition hover:border-emerald-400/30 hover:text-white"
              >
                View public site ↗
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
    </div>
  );
}
