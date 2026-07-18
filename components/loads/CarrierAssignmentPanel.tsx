"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CarrierOption {
    id: string;
    name: string;
}

interface CarrierAssignmentPanelProps {
    loadId: string;
    currentStatus: string;
    carriers: CarrierOption[];
    userOrgType: "BROKER" | "CARRIER" | "SHIPPER";
    isOrgAdmin: boolean;
    userPermissions: string[];
}

export default function CarrierAssignmentPanel({
    loadId,
    currentStatus,
    carriers,
    userOrgType,
    isOrgAdmin,
    userPermissions,
}: CarrierAssignmentPanelProps) {
    const router = useRouter();
    const [selectedCarrierId, setSelectedCarrierId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canAssign = userOrgType === "BROKER" && (isOrgAdmin || userPermissions.includes("load.assign_carrier"));

    if (!canAssign) {
        return null;
    }

    // Only show assignment form if status is POSTED (unassigned)
    if (currentStatus !== "POSTED") {
        return null;
    }

    async function handleAssign(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedCarrierId) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/loads/${loadId}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ carrierOrgId: selectedCarrierId }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to assign carrier");
            }

            router.refresh();
        } catch (err: any) {
            setError(err.message || "An error occurred during assignment");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            marginTop: 16
        }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 12 }}>
                Assign Carrier
            </h3>

            {error && (
                <div style={{
                    background: "var(--color-error-light)",
                    border: "1px solid var(--color-error)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 12px",
                    color: "var(--color-error)",
                    fontSize: 13,
                    marginBottom: 12
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleAssign} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                        Select Carrier Org
                    </label>
                    <select
                        required
                        value={selectedCarrierId}
                        onChange={(e) => setSelectedCarrierId(e.target.value)}
                        style={{
                            width: "100%",
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 12px",
                            fontSize: 13,
                            color: "var(--color-text-primary)",
                            fontFamily: "inherit"
                        }}
                    >
                        <option value="">Choose a carrier...</option>
                        {carriers.map((carrier) => (
                            <option key={carrier.id} value={carrier.id}>
                                {carrier.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={loading || !selectedCarrierId}
                    style={{
                        background: "var(--color-accent)",
                        color: "var(--color-accent-foreground)",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        opacity: loading ? 0.7 : 1,
                        height: 38
                    }}
                >
                    {loading ? "Assigning..." : "Assign"}
                </button>
            </form>
        </div>
    );
}
