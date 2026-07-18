"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { SessionUser } from "@/types";

interface TableLoad {
    _id: string;
    shipperName: string;
    origin: string;
    destination: string;
    status: string;
    complianceFlagged: boolean;
    pickupDate: string;
    createdAt: string;
}

interface BrokerDashboardProps {
    user: SessionUser;
}

export function LocalStatusBadge({ status }: { status: string }) {
    let background = "var(--color-surface-secondary)";
    let color = "var(--color-text-secondary)";

    switch (status) {
        case "POSTED":
            background = "rgba(152, 161, 172, 0.15)";
            color = "var(--color-text-secondary)";
            break;
        case "CARRIER_ASSIGNED":
        case "RATE_CONFIRMED":
            background = "var(--color-accent-light)";
            color = "var(--color-accent)";
            break;
        case "DISPATCHED":
        case "IN_TRANSIT":
            background = "var(--color-warning-light)";
            color = "var(--color-warning)";
            break;
        case "DELIVERED":
        case "POD_VERIFIED":
            background = "var(--color-success-light)";
            color = "var(--color-success)";
            break;
        case "INVOICED_CLOSED":
            background = "var(--color-surface-secondary)";
            color = "var(--color-text-muted)";
            break;
    }

    return (
        <span style={{
            background,
            color,
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.02em",
            display: "inline-block",
            whiteSpace: "nowrap"
        }}>
            {status.replace("_", " ")}
        </span>
    );
}

export default function BrokerDashboard({ user }: BrokerDashboardProps) {
    const [loads, setLoads] = useState<TableLoad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch("/api/loads");
                const resJson = await res.json();
                if (!res.ok || !resJson.success) {
                    throw new Error(resJson.error || "Failed to load dashboard data");
                }
                setLoads(resJson.data);
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Derived statistics
    const totalLoads = loads.length;
    const flaggedLoads = loads.filter((l) => l.complianceFlagged).length;
    const inTransitLoads = loads.filter((l) => l.status === "IN_TRANSIT").length;

    // 5 most recent
    const recentLoads = loads.slice(0, 5);

    if (loading) {
        return (
            <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                Loading dashboard data...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                background: "var(--color-error-light)",
                border: "1px solid var(--color-error)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                color: "var(--color-error)",
                fontSize: 14
            }}>
                Error: {error}
            </div>
        );
    }

    return (
        <div>
            {/* Stats KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
                <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20
                }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                        Total Active Loads
                    </span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 8 }}>
                        {totalLoads}
                    </div>
                </div>

                <div style={{
                    background: "var(--color-surface)",
                    border: flaggedLoads > 0 ? "1px solid var(--color-error)" : "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20
                }}>
                    <span style={{ fontSize: 13, color: flaggedLoads > 0 ? "var(--color-error)" : "var(--color-text-secondary)", fontWeight: 500 }}>
                        Flagged Loads
                    </span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: flaggedLoads > 0 ? "var(--color-error)" : "var(--color-text-primary)", marginTop: 8 }}>
                        {flaggedLoads}
                    </div>
                    {flaggedLoads > 0 && (
                        <div style={{ fontSize: 12, color: "var(--color-error)", marginTop: 4 }}>
                            Requires override to confirm rate
                        </div>
                    )}
                </div>

                <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20
                }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                        In Transit
                    </span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 8 }}>
                        {inTransitLoads}
                    </div>
                </div>
            </div>

            {/* Recent Loads Table Card */}
            <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: 24
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
                        Recent Operations
                    </h2>
                    <Link href="/loads" style={{
                        fontSize: 13,
                        color: "var(--color-accent)",
                        fontWeight: 600,
                        textDecoration: "none"
                    }}>
                        View Load Board &rarr;
                    </Link>
                </div>

                {recentLoads.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 12 }}>
                            No active loads found.
                        </p>
                        {user.permissions.includes("load.create") && (
                            <Link href="/loads" style={{
                                display: "inline-block",
                                background: "var(--color-accent)",
                                color: "var(--color-accent-foreground)",
                                borderRadius: "var(--radius-md)",
                                padding: "8px 16px",
                                fontSize: 13,
                                fontWeight: 500,
                                textDecoration: "none"
                            }}>
                                Post Your First Load
                            </Link>
                        )}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                        Load Ref
                                    </th>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                        Shipper
                                    </th>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                        Route
                                    </th>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                        Status
                                    </th>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                        Pickup Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLoads.map((load) => (
                                    <tr
                                        key={load._id}
                                        style={{
                                            borderBottom: "1px solid var(--color-border)",
                                            transition: "background 0.1s ease",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-secondary)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ padding: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                                            <Link href={`/loads/${load._id}`} style={{ display: "block", padding: "16px", color: "inherit", textDecoration: "none" }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                    #{load._id.substring(0, 8).toUpperCase()}
                                                    {load.complianceFlagged && (
                                                        <span
                                                            title="Compliance issue flagged"
                                                            style={{
                                                                color: "var(--color-error)",
                                                                fontSize: 14,
                                                                fontWeight: "bold",
                                                                cursor: "help"
                                                            }}
                                                        >
                                                            ⚠️
                                                        </span>
                                                    )}
                                                </span>
                                            </Link>
                                        </td>
                                        <td style={{ padding: 0, fontSize: 14, color: "var(--color-text-primary)" }}>
                                            <Link href={`/loads/${load._id}`} style={{ display: "block", padding: "16px", color: "inherit", textDecoration: "none" }}>
                                                {load.shipperName}
                                            </Link>
                                        </td>
                                        <td style={{ padding: 0, fontSize: 14, color: "var(--color-text-primary)" }}>
                                            <Link href={`/loads/${load._id}`} style={{ display: "block", padding: "16px", color: "inherit", textDecoration: "none" }}>
                                                {load.origin} &rarr; {load.destination}
                                            </Link>
                                        </td>
                                        <td style={{ padding: 0 }}>
                                            <Link href={`/loads/${load._id}`} style={{ display: "block", padding: "10px 16px", color: "inherit", textDecoration: "none" }}>
                                                <LocalStatusBadge status={load.status} />
                                            </Link>
                                        </td>
                                        <td style={{ padding: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
                                            <Link href={`/loads/${load._id}`} style={{ display: "block", padding: "16px", color: "inherit", textDecoration: "none" }}>
                                                {new Date(load.pickupDate).toLocaleDateString()}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
