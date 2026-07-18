"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface LoadStatusActionsProps {
    loadId: string;
    currentStatus: string;
    carrierOrgId: string | null;
    brokerOrgId: string;
    userOrgType: "BROKER" | "CARRIER" | "SHIPPER";
    userOrgId: string | null;
    isOrgAdmin: boolean;
    userPermissions: string[];
}

export default function LoadStatusActions({
    loadId,
    currentStatus,
    carrierOrgId,
    brokerOrgId,
    userOrgType,
    userOrgId,
    isOrgAdmin,
    userPermissions,
}: LoadStatusActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);

    const hasUpdateStatus = userOrgType !== "SHIPPER" && (isOrgAdmin || userPermissions.includes("load.update_status"));

    if (!hasUpdateStatus) {
        return null; // hide completely
    }

    async function handleTransition(targetStatus: string, customNote?: string) {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/loads/${loadId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: targetStatus,
                    note: customNote || null,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to update status");
            }

            setShowNoteInput(false);
            setNote("");
            setPendingStatus(null);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Something went wrong changing status");
        } finally {
            setLoading(false);
        }
    }

    // Determine valid actions
    const isAssignedCarrier = userOrgType === "CARRIER" && carrierOrgId && userOrgId === carrierOrgId;
    const isOwnerBroker = userOrgType === "BROKER" && userOrgId === brokerOrgId;

    const showDecline = isAssignedCarrier && currentStatus === "CARRIER_ASSIGNED";
    const showDispatch = isAssignedCarrier && currentStatus === "RATE_CONFIRMED";
    const showTransit = isAssignedCarrier && currentStatus === "DISPATCHED";
    const showDeliver = isAssignedCarrier && currentStatus === "IN_TRANSIT";
    const showClose = isOwnerBroker && (currentStatus === "DELIVERED" || currentStatus === "POD_VERIFIED");

    const hasActions = showDecline || showDispatch || showTransit || showDeliver || showClose;

    if (!hasActions) return null;

    if (showNoteInput && pendingStatus) {
        return (
            <div style={{
                background: "var(--color-surface-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                marginTop: 16
            }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>
                    Add optional reason/note for entering status: {pendingStatus}
                </h4>
                <textarea
                    placeholder="e.g. Traffic delays, documents complete..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{
                        width: "100%",
                        height: 60,
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        padding: "8px 12px",
                        fontSize: 13,
                        color: "var(--color-text-primary)",
                        fontFamily: "inherit",
                        marginBottom: 12,
                        resize: "none"
                    }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => handleTransition(pendingStatus, note)}
                        disabled={loading}
                        style={{
                            background: "var(--color-accent)",
                            color: "var(--color-accent-foreground)",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            padding: "6px 12px",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Submitting..." : "Submit Status"}
                    </button>
                    <button
                        onClick={() => {
                            setShowNoteInput(false);
                            setPendingStatus(null);
                            setNote("");
                        }}
                        style={{
                            background: "var(--color-surface)",
                            color: "var(--color-text-primary)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            padding: "6px 12px",
                            fontSize: 13,
                            cursor: "pointer"
                        }}
                    >
                        Cancel
                    </button>
                </div>
                {error && <div style={{ color: "var(--color-error)", fontSize: 12, marginTop: 8 }}>{error}</div>}
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                Transit Actions
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {showDecline && (
                    <button
                        onClick={() => {
                            setPendingStatus("POSTED");
                            setShowNoteInput(true);
                        }}
                        style={{
                            background: "var(--color-error)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer"
                        }}
                    >
                        Decline Assignment
                    </button>
                )}

                {showDispatch && (
                    <button
                        onClick={() => handleTransition("DISPATCHED")}
                        disabled={loading}
                        style={{
                            background: "var(--color-accent)",
                            color: "var(--color-accent-foreground)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Dispatching..." : "Dispatch Driver"}
                    </button>
                )}

                {showTransit && (
                    <button
                        onClick={() => handleTransition("IN_TRANSIT")}
                        disabled={loading}
                        style={{
                            background: "var(--color-accent)",
                            color: "var(--color-accent-foreground)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Updating..." : "Mark In Transit"}
                    </button>
                )}

                {showDeliver && (
                    <button
                        onClick={() => handleTransition("DELIVERED")}
                        disabled={loading}
                        style={{
                            background: "var(--color-accent)",
                            color: "var(--color-accent-foreground)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Reporting..." : "Mark Delivered"}
                    </button>
                )}

                {showClose && (
                    <button
                        onClick={() => {
                            setPendingStatus("INVOICED_CLOSED");
                            setShowNoteInput(true);
                        }}
                        style={{
                            background: "var(--color-accent)",
                            color: "var(--color-accent-foreground)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer"
                        }}
                    >
                        Invoice & Close Load
                    </button>
                )}
            </div>
            {error && <div style={{ color: "var(--color-error)", fontSize: 13 }}>{error}</div>}
        </div>
    );
}
