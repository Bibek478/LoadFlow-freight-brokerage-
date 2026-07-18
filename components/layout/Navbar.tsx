"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/types";

interface NavbarProps {
    user: SessionUser | null;
}

export default function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const linkClass = (href: string) =>
        `text-sm font-medium transition-colors ${pathname === href || pathname.startsWith(href + "/")
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        }`;

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <nav
            style={{
                height: 60,
                background: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
                position: "sticky",
                top: 0,
                zIndex: 10,
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: "0 24px",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                }}
            >
                <Link href="/dashboard" style={{ fontWeight: 700, fontSize: 16, color: "var(--color-accent)", textDecoration: "none" }}>
                    LoadFlow
                </Link>

                {user && (
                    <div style={{ display: "flex", alignItems: "center", gap: 24, flex: 1 }}>
                        <Link href="/dashboard" className={linkClass("/dashboard")}>
                            Dashboard
                        </Link>

                        {user.orgType === "BROKER" && (
                            <Link href="/loads" className={linkClass("/loads")}>
                                Load Board
                            </Link>
                        )}

                        {user.orgType === "CARRIER" && (
                            <Link href="/compliance" className={linkClass("/compliance")}>
                                Compliance
                            </Link>
                        )}

                        {(user.orgType === "BROKER" || user.orgType === "CARRIER") &&
                            user.isOrgAdmin && (
                                <Link href="/staff" className={linkClass("/staff")}>
                                    Staff
                                </Link>
                            )}
                    </div>
                )}

                {user && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {user.orgType !== "SHIPPER" && (
                            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                                {user.name}
                            </span>
                        )}
                        <button
                            onClick={handleLogout}
                            style={{
                                fontSize: 13,
                                color: "var(--color-text-secondary)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "inherit",
                            }}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
