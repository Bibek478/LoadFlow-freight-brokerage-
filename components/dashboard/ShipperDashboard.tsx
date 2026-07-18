"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { SessionUser } from "@/types";
import { LocalStatusBadge } from "./BrokerDashboard";

interface TableLoad {
    _id: string;
    origin: string;
    destination: string;
    status: string;
    carrierName: string;
    complianceFlagged: boolean;
    pickupDate: string;
    createdAt: string;
}

interface ShipperDashboardProps {
    user: SessionUser;
}

export default function ShipperDashboard({ user }: ShipperDashboardProps) {
    const [loads, setLoads] = useState<TableLoad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch("/api/loads");
                const resJson = await res.json();
                if (!res.ok || !resJson.success) {
                    throw new Error(resJson.error || "Failed to load shipper data");
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

    // Stats calculations
    const totalShipments = loads.length;
    const activeTransitShipments = loads.filter((l) => l.status === "IN_TRANSIT").length;
    const completedShipments = loads.filter((l) => l.status === "DELIVERED" || l.status === "POD_VERIFIED" || l.status === "INVOICED_CLOSED").length;

    if (loading) {
        return (
            <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                Loading shipments tracker...
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
                        Total Shipments
                    </span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 8 }}>
                        {totalShipments}
                    </div>
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
                        {activeTransitShipments}
                    </div>
                </div>

                <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20
                }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                        Completed Deliveries
                    </span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 8 }}>
                        {completedShipments}
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

            {/* Shipment list table */}
            <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: 24
            }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
                    My Shipments & Tracking
                </h2>

                {loads.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                            No shipments found.
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
                                        Carrier
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
                                {loads.map((load) => (
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
                                                {load.origin} &rarr; {load.destination}
                                            </Link>
                                        </td>
                                        <td style={{ padding: 0, fontSize: 14, color: "var(--color-text-primary)" }}>
                                            <Link href={`/loads/${load._id}`} style={{ display: "block", padding: "16px", color: "inherit", textDecoration: "none" }}>
                                                {load.carrierName}
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
