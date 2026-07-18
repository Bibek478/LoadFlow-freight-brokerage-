"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";
import { LocalStatusBadge } from "./BrokerDashboard";

interface RateConfirmation {
    totalRate: number;
    isCurrent: boolean;
}

interface TableLoad {
    _id: string;
    origin: string;
    destination: string;
    status: string;
    complianceFlagged: boolean;
    pickupDate: string;
    createdAt: string;
    rateConfirmations?: RateConfirmation[];
}

interface CarrierDashboardProps {
    user: SessionUser;
}

export default function CarrierDashboard({ user }: CarrierDashboardProps) {
    const router = useRouter();
    const [loads, setLoads] = useState<TableLoad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const hasUpdateStatus = user.isOrgAdmin || user.permissions.includes("load.update_status");

    async function loadData() {
        try {
            const res = await fetch("/api/loads");
            const resJson = await res.json();
            if (!res.ok || !resJson.success) {
                throw new Error(resJson.error || "Failed to load carrier data");
            }
            setLoads(resJson.data);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleShortcutAction(loadId: string, targetStatus: string, defaultNote?: string) {
        setActionLoadingId(loadId);
        setError(null);
        try {
            const res = await fetch(`/api/loads/${loadId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: targetStatus,
                    note: defaultNote || null,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Status update failed");
            }
            // Real-time local refresh
            await loadData();
        } catch (err: any) {
            setError(err.message || "Something went wrong changing status");
        } finally {
            setActionLoadingId(null);
        }
    }

    // Stats calculations
    const assignedLoadsCount = loads.filter((l) => l.status === "CARRIER_ASSIGNED" || l.status === "RATE_CONFIRMED").length;
    const activeLoadsCount = loads.filter((l) => l.status === "DISPATCHED" || l.status === "IN_TRANSIT").length;
    const completedLoadsCount = loads.filter((l) => l.status === "DELIVERED" || l.status === "POD_VERIFIED" || l.status === "INVOICED_CLOSED").length;

    if (loading) {
        return (
            <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                Loading operations dashboard...
            </div>
        );
    }

    return (
        <div>
            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
                <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20
                }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                        Assigned Shipments
                    </span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 8 }}>
                        {assignedLoadsCount}
                    </div>
                </div>

                <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20
                }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                        Active In-Transit
                    </span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 8 }}>
                        {activeLoadsCount}
                    </div>
                </div>

                <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20
                }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                        Completed Shipments
                    </span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 8 }}>
                        {completedLoadsCount}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: "var(--color-error-light)",
                    border: "1px solid var(--color-error)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    color: "var(--color-error)",
                    fontSize: 14,
                    marginBottom: 20
                }}>
                    Error: {error}
                </div>
            )}

            {/* Active Shipments Card */}
            <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: 24
            }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
                    Assigned Loads Operations
                </h2>

                {loads.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                            No assigned shipments found.
                        </p>
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
                                        Route
                                    </th>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                        Rate
                                    </th>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                        Status
                                    </th>
                                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                        Inline Shortcuts
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loads.map((load) => {
                                    const currentRate = load.rateConfirmations?.find((r) => r.isCurrent);
                                    const isPendingAction = actionLoadingId === load._id;

                                    return (
                                        <tr
                                            key={load._id}
                                            style={{
                                                borderBottom: "1px solid var(--color-border)",
                                                transition: "background 0.1s ease",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-secondary)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <td
                                                onClick={() => router.push(`/loads/${load._id}`)}
                                                style={{
                                                    padding: "16px",
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: "var(--color-text-primary)",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                    #{load._id.substring(0, 8).toUpperCase()}
                                                    {load.complianceFlagged && (
                                                        <span
                                                            title="Compliance flagged"
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
                                            </td>
                                            <td
                                                onClick={() => router.push(`/loads/${load._id}`)}
                                                style={{
                                                    padding: "16px",
                                                    fontSize: 14,
                                                    color: "var(--color-text-primary)",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {load.origin} &rarr; {load.destination}
                                            </td>
                                            <td
                                                onClick={() => router.push(`/loads/${load._id}`)}
                                                style={{
                                                    padding: "16px",
                                                    fontSize: 14,
                                                    color: "var(--color-text-primary)",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {currentRate ? `$${currentRate.totalRate}` : "Negotiating"}
                                            </td>
                                            <td
                                                onClick={() => router.push(`/loads/${load._id}`)}
                                                style={{ padding: "10px 16px", cursor: "pointer" }}
                                            >
                                                <LocalStatusBadge status={load.status} />
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {hasUpdateStatus && !isPendingAction && (
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        {load.status === "CARRIER_ASSIGNED" && (
                                                            <button
                                                                onClick={() => handleShortcutAction(load._id, "POSTED", "Declined from dashboard")}
                                                                style={{
                                                                    background: "var(--color-error)",
                                                                    color: "#ffffff",
                                                                    border: "none",
                                                                    borderRadius: "var(--radius-sm)",
                                                                    padding: "6px 12px",
                                                                    fontSize: 12,
                                                                    fontWeight: 500,
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                Decline
                                                            </button>
                                                        )}
                                                        {load.status === "RATE_CONFIRMED" && (
                                                            <button
                                                                onClick={() => handleShortcutAction(load._id, "DISPATCHED")}
                                                                style={{
                                                                    background: "var(--color-accent)",
                                                                    color: "var(--color-accent-foreground)",
                                                                    border: "none",
                                                                    borderRadius: "var(--radius-sm)",
                                                                    padding: "6px 12px",
                                                                    fontSize: 12,
                                                                    fontWeight: 500,
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                Dispatch Driver
                                                            </button>
                                                        )}
                                                        {load.status === "DISPATCHED" && (
                                                            <button
                                                                onClick={() => handleShortcutAction(load._id, "IN_TRANSIT")}
                                                                style={{
                                                                    background: "var(--color-accent)",
                                                                    color: "var(--color-accent-foreground)",
                                                                    border: "none",
                                                                    borderRadius: "var(--radius-sm)",
                                                                    padding: "6px 12px",
                                                                    fontSize: 12,
                                                                    fontWeight: 500,
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                Mark In Transit
                                                            </button>
                                                        )}
                                                        {load.status === "IN_TRANSIT" && (
                                                            <button
                                                                onClick={() => handleShortcutAction(load._id, "DELIVERED")}
                                                                style={{
                                                                    background: "var(--color-accent)",
                                                                    color: "var(--color-accent-foreground)",
                                                                    border: "none",
                                                                    borderRadius: "var(--radius-sm)",
                                                                    padding: "6px 12px",
                                                                    fontSize: 12,
                                                                    fontWeight: 500,
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                Mark Delivered
                                                            </button>
                                                        )}
                                                        {!["CARRIER_ASSIGNED", "RATE_CONFIRMED", "DISPATCHED", "IN_TRANSIT"].includes(load.status) && (
                                                            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                                                                No actions remaining
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {isPendingAction && (
                                                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                                                        Updating status...
                                                    </span>
                                                )}
                                                {!hasUpdateStatus && (
                                                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                                                        ReadOnly
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
