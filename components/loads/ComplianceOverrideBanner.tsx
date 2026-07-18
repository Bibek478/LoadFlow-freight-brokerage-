"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ComplianceOverrideBannerProps {
    loadId: string;
    complianceFlagged: boolean;
    complianceFlagReason: string | null;
    userOrgType: "BROKER" | "CARRIER" | "SHIPPER";
    isOrgAdmin: boolean;
    userPermissions: string[];
}

export default function ComplianceOverrideBanner({
    loadId,
    complianceFlagged,
    complianceFlagReason,
    userOrgType,
    isOrgAdmin,
    userPermissions,
}: ComplianceOverrideBannerProps) {
    const router = useRouter();
    const [note, setNote] = useState("");
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canOverride = userOrgType === "BROKER" && (isOrgAdmin || userPermissions.includes("load.override_compliance_flag"));

    if (!complianceFlagged) {
        return null; // do not show banner if not flagged
    }

    async function handleOverride(e: React.FormEvent) {
        e.preventDefault();
        if (!note.trim()) {
            setError("An override reason note is required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/loads/${loadId}/override`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to override compliance flag");
            }

            setShowNoteInput(false);
            setNote("");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "An error occurred during override");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            background: "var(--color-warning-light)",
            border: "1px solid var(--color-warning)",
            borderRadius: "var(--radius-lg)",
            padding: 16,
            marginBottom: 24,
            color: "var(--color-warning)",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        ⚠️ Compliance Flagged
                    </h3>
                    <p style={{ fontSize: 13, margin: "4px 0 0 0", color: "var(--color-text-primary)" }}>
                        Reason: {complianceFlagReason || "Carrier falls out of active compliance checks."}
                    </p>
                </div>

                {canOverride && !showNoteInput && (
                    <button
                        onClick={() => setShowNoteInput(true)}
                        style={{
                            background: "var(--color-warning)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        Override Flag
                    </button>
                )}
            </div>

            {showNoteInput && (
                <form onSubmit={handleOverride} style={{
                    marginTop: 16,
                    borderTop: "1px solid var(--color-warning)",
                    paddingTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12
                }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
                        Provide explanation note to override this compliance flag:
                    </label>
                    <textarea
                        required
                        placeholder="e.g. Validated active insurance binder manually. Compliance lead approved."
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
                            resize: "none"
                        }}
                    />

                    {error && <div style={{ color: "var(--color-error)", fontSize: 12 }}>{error}</div>}

                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: "var(--color-success)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "var(--radius-sm)",
                                padding: "6px 12px",
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: "pointer",
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? "Submitting..." : "Apply Override"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowNoteInput(false);
                                setNote("");
                                setError(null);
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
                </form>
            )}
        </div>
    );
}
