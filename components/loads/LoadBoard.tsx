"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { SessionUser } from "@/types";
import { LocalStatusBadge } from "../dashboard/BrokerDashboard";
import LoadForm from "./LoadForm";

interface ShipperOption {
    id: string;
    name: string;
    email: string;
}

interface TableLoad {
    _id: string;
    shipperName: string;
    origin: string;
    destination: string;
    status: string;
    carrierName: string;
    complianceFlagged: boolean;
    complianceFlagReason: string | null;
    pickupDate: string;
    createdAt: string;
}

interface LoadBoardProps {
    user: SessionUser;
    shippers: ShipperOption[];
}

export default function LoadBoard({ user, shippers }: LoadBoardProps) {
    const [search, setSearch] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [loads, setLoads] = useState<TableLoad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPostForm, setShowPostForm] = useState(false);

    const canCreate = user.isOrgAdmin || user.permissions.includes("load.create");

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams();
                if (search) queryParams.set("search", search);
                if (selectedStatus) queryParams.set("status", selectedStatus);

                const res = await fetch(`/api/loads?${queryParams.toString()}`, {
                    signal: controller.signal,
                });
                const resJson = await res.json();
                if (!res.ok || !resJson.success) {
                    throw new Error(resJson.error || "Failed to load board");
                }
                setLoads(resJson.data);
                setError(null);
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    setError(err.message || "An unexpected error occurred");
                }
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search, selectedStatus]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Header & Post CTA */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)" }}>
                        Load Board
                    </h1>
                    <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                        Filter and manage your brokerage shipments
                    </p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setShowPostForm(!showPostForm)}
                        style={{
                            background: showPostForm ? "var(--color-surface)" : "var(--color-accent)",
                            color: showPostForm ? "var(--color-text-primary)" : "var(--color-accent-foreground)",
                            border: showPostForm ? "1px solid var(--color-border)" : "none",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        {showPostForm ? "Hide Form" : "+ Post New Load"}
                    </button>
                )}
            </div>

            {/* Toggleable Post Form Card */}
            {canCreate && showPostForm && (
                <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20,
                }}>
                    <LoadForm shippers={shippers} />
                </div>
            )}

            {/* Filter Bar Card */}
            <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: 16,
                display: "flex",
                gap: 16,
                flexWrap: "wrap"
            }}>
                <div style={{ flex: 2, minWidth: 260 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                        Search
                    </label>
                    <input
                        type="text"
                        placeholder="Search shipper, origin, destination, carrier..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 12px",
                            fontSize: 14,
                            color: "var(--color-text-primary)",
                            fontFamily: "inherit"
                        }}
                    />
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                        Status Filter
                    </label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={{
                            width: "100%",
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 12px",
                            fontSize: 14,
                            color: "var(--color-text-primary)",
                            fontFamily: "inherit"
                        }}
                    >
                        <option value="">All Statuses</option>
                        <option value="POSTED">Posted</option>
                        <option value="CARRIER_ASSIGNED">Carrier Assigned</option>
                        <option value="RATE_CONFIRMED">Rate Confirmed</option>
                        <option value="DISPATCHED">Dispatched</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="POD_VERIFIED">POD Verified</option>
                        <option value="INVOICED_CLOSED">Invoiced/Closed</option>
                    </select>
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
                    fontSize: 14
                }}>
                    Error: {error}
                </div>
            )}

            {/* Table Container Card */}
            <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: 24,
                overflowX: "auto"
            }}>
                {loading && loads.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)", fontSize: 14 }}>
                        Loading load board details...
                    </div>
                ) : loads.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 12 }}>
                            No loads matched the selected filters.
                        </p>
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                    Load Ref
                                </th>
                                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                    Company/Shipper
                                </th>
                                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                    Route
                                </th>
                                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                    Status
                                </th>
                                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                                    Carrier
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
                                        background: loading ? "var(--color-surface-secondary)" : "transparent"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loading) e.currentTarget.style.background = "var(--color-surface-secondary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!loading) e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <td style={{ padding: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                                        <Link href={`/loads/${load._id}`} style={{ display: "block", padding: "16px", color: "inherit", textDecoration: "none" }}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                #{load._id.substring(0, 8).toUpperCase()}
                                                {load.complianceFlagged && (
                                                    <span
                                                        title={`Compliance flagged: ${load.complianceFlagReason || "Unknown reason"}`}
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
                                    <td style={{ padding: 0, fontSize: 14, color: "var(--color-text-primary)" }}>
                                        <Link href={`/loads/${load._id}`} style={{ display: "block", padding: "16px", color: "inherit", textDecoration: "none" }}>
                                            {load.carrierName}
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
                )}
            </div>
        </div>
    );
}
