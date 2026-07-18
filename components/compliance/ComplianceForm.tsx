"use client";

import { useState, useEffect } from "react";
import type { SessionUser } from "@/types";

interface ComplianceFormProps {
    user: SessionUser;
}

export default function ComplianceForm({ user }: ComplianceFormProps) {
    const [insuranceExpiry, setInsuranceExpiry] = useState("");
    const [mcDotStatus, setMcDotStatus] = useState<"ACTIVE" | "EXPIRED" | "SUSPENDED">("ACTIVE");
    const [equipmentInput, setEquipmentInput] = useState("");
    const [commodityInput, setCommodityInput] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        async function fetchCompliance() {
            try {
                const res = await fetch("/api/compliance");
                const data = await res.json();
                if (data.success && data.data) {
                    const record = data.data;
                    if (record.insuranceExpiry) {
                        // Format date to YYYY-MM-DD for input[type="date"]
                        const dateStr = new Date(record.insuranceExpiry).toISOString().split("T")[0];
                        setInsuranceExpiry(dateStr);
                    }
                    if (record.mcDotStatus) {
                        setMcDotStatus(record.mcDotStatus);
                    }
                    if (record.approvedEquipmentTypes) {
                        setEquipmentInput(record.approvedEquipmentTypes.join(", "));
                    }
                    if (record.approvedCommodityTypes) {
                        setCommodityInput(record.approvedCommodityTypes.join(", "));
                    }
                }
            } catch (err) {
                setError("Failed to load compliance record");
            } finally {
                setLoading(false);
            }
        }
        void fetchCompliance();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccessMessage("");

        const approvedEquipmentTypes = equipmentInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        const approvedCommodityTypes = commodityInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        try {
            const res = await fetch("/api/compliance", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    insuranceExpiry,
                    mcDotStatus,
                    approvedEquipmentTypes,
                    approvedCommodityTypes,
                }),
            });

            const data = await res.json();
            if (!data.success) {
                setError(data.error ?? "Failed to save compliance record");
                return;
            }

            setSuccessMessage("Compliance record updated successfully.");
        } catch (err) {
            setError("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div style={{ padding: 20, color: "var(--color-text-secondary)", fontSize: 14 }}>
                Loading compliance record...
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {error && (
                <div
                    style={{
                        padding: "10px 12px",
                        background: "var(--color-error-light)",
                        border: "1px solid var(--color-error)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--color-error)",
                        fontSize: 13,
                    }}
                >
                    {error}
                </div>
            )}

            {successMessage && (
                <div
                    style={{
                        padding: "10px 12px",
                        background: "var(--color-success-light)",
                        border: "1px solid var(--color-success)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--color-success)",
                        fontSize: 13,
                    }}
                >
                    {successMessage}
                </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                {/* Insurance Expiry */}
                <div style={{ flex: "1 1 calc(50% - 10px)", minWidth: 280 }}>
                    <label htmlFor="insuranceExpiry" style={labelStyle}>
                        Insurance Expiration Date
                    </label>
                    <input
                        id="insuranceExpiry"
                        type="date"
                        required
                        value={insuranceExpiry}
                        onChange={(e) => setInsuranceExpiry(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                {/* MC/DOT Status */}
                <div style={{ flex: "1 1 calc(50% - 10px)", minWidth: 280 }}>
                    <label htmlFor="mcDotStatus" style={labelStyle}>
                        MC/DOT Safety Status
                    </label>
                    <select
                        id="mcDotStatus"
                        value={mcDotStatus}
                        onChange={(e) => setMcDotStatus(e.target.value as any)}
                        style={selectStyle}
                    >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="EXPIRED">EXPIRED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                </div>
            </div>

            {/* Approved Equipment Types */}
            <div>
                <label htmlFor="approvedEquipmentTypes" style={labelStyle}>
                    Approved Equipment Types
                </label>
                <input
                    id="approvedEquipmentTypes"
                    type="text"
                    required
                    value={equipmentInput}
                    onChange={(e) => setEquipmentInput(e.target.value)}
                    style={inputStyle}
                    placeholder="Dry Van, Reefer, Flatbed, Step Deck"
                />
                <span style={hintStyle}>
                    Comma-separated list (e.g. Dry Van, Reefer, Flatbed)
                </span>
            </div>

            {/* Approved Commodity Types */}
            <div>
                <label htmlFor="approvedCommodityTypes" style={labelStyle}>
                    Approved Commodity Types
                </label>
                <input
                    id="approvedCommodityTypes"
                    type="text"
                    required
                    value={commodityInput}
                    onChange={(e) => setCommodityInput(e.target.value)}
                    style={inputStyle}
                    placeholder="General Freight, Produce, Electronics, Hazmat"
                />
                <span style={hintStyle}>
                    Comma-separated list (e.g. General Freight, Produce, Electronics)
                </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button
                    id="save-compliance-btn"
                    type="submit"
                    disabled={saving}
                    style={buttonStyle(saving)}
                >
                    {saving ? "Saving Changes..." : "Save Compliance Details"}
                </button>
            </div>
        </form>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: 14,
    color: "var(--color-text-primary)",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    outline: "none",
    fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: 14,
    color: "var(--color-text-primary)",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    outline: "none",
    fontFamily: "inherit",
};

const hintStyle: React.CSSProperties = {
    display: "block",
    marginTop: 4,
    fontSize: 12,
    color: "var(--color-text-muted)",
};

function buttonStyle(disabled: boolean): React.CSSProperties {
    return {
        padding: "10px 16px",
        background: disabled ? "var(--color-accent-light)" : "var(--color-accent)",
        color: "var(--color-accent-foreground)",
        border: "none",
        borderRadius: "var(--radius-md)",
        fontWeight: 500,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.7 : 1,
        transition: "opacity 0.2s ease",
    };
}
