import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dire Sport Fields | Your City. Your Sport. Your Game.",
  description:
    "Discover sports facilities across Dire Dawa, compare venue details, and book your next game in one place.",
  icons: {
    icon: "/dire-sport-fields-icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
