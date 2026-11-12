import type { Metadata } from "next";
import AdminShell from "@/src/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin | Dire Sport Fields",
  description: "Secure administration workspace for Dire Sport Fields.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
