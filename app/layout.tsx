import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "LoadFlow — Freight Brokerage Operations",
  description: "Freight brokerage operations suite: loads, carriers, compliance, RBAC.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={inter.variable}>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar user={user} />
        <main style={{ flex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
