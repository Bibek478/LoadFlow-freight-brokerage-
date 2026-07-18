"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Accessorial {
    description: string;
    amount: number;
}

interface RateConfirmationVersion {
    version: number;
    baseRate: number;
    accessorials: Accessorial[];
    totalRate: number;
    confirmedByUserId: string;
    confirmedAt: string;
    isCurrent: boolean;
}

interface RateConfirmationPanelProps {
    loadId: string;
    currentStatus: string;
    carrierOrgId: string | null;
    rateConfirmations: RateConfirmationVersion[];
    userOrgType: "BROKER" | "CARRIER" | "SHIPPER";
    isOrgAdmin: boolean;
    userPermissions: string[];
}

export default function RateConfirmationPanel({
    loadId,
    currentStatus,
    carrierOrgId,
    rateConfirmations,
    userOrgType,
    isOrgAdmin,
    userPermissions,
}: RateConfirmationPanelProps) {
    const router = useRouter();
    const [baseRate, setBaseRate] = useState("");
    const [accessorials, setAccessorials] = useState<Accessorial[]>([]);
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const canConfirmRate = userOrgType === "BROKER" && (isOrgAdmin || userPermissions.includes("rate.confirm"));
    const isEligibleState = carrierOrgId !== null && (currentStatus === "CARRIER_ASSIGNED" || currentStatus === "RATE_CONFIRMED");

    const currentRate = rateConfirmations.find((r) => r.isCurrent);
    const historicalRates = rateConfirmations.filter((r) => !r.isCurrent).sort((a, b) => b.version - a.version);

    // Compute dynamic running total for the form input
    const accessorialSum = accessorials.reduce((sum, acc) => sum + acc.amount, 0);
    const computedTotal = (parseFloat(baseRate) || 0) + accessorialSum;

    function addAccessorial() {
        if (!desc || !amount) return;
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt < 0) return;

        setAccessorials([...accessorials, { description: desc, amount: amt }]);
        setDesc("");
        setAmount("");
    }

    function removeAccessorial(index: number) {
        setAccessorials(accessorials.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const base = parseFloat(baseRate);
        if (isNaN(base) || base < 0) {
            setError("Base rate must be a positive number");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/rate-confirmations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    loadId,
                    baseRate: base,
                    accessorials,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to confirm rate");
            }

            setBaseRate("");
            setAccessorials([]);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "An error occurred while confirming rate");
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
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 16 }}>
                Rate Confirmations
            </h3>

            {/* Current Active Rate */}
            {currentRate ? (
                <div style={{
                    background: "var(--color-surface-secondary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    marginBottom: 20
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-accent)", textTransform: "uppercase" }}>
                                Active Rate (v{currentRate.version})
                            </span>
                            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 4 }}>
                                ${currentRate.totalRate.toFixed(2)}
                            </div>
                        </div>
                        <div style={{ textAlign: "right", fontSize: 12, color: "var(--color-text-secondary)" }}>
                            <div>Base: ${currentRate.baseRate.toFixed(2)}</div>
                            {currentRate.accessorials.length > 0 && (
                                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
                                    Accessorials ({currentRate.accessorials.length}): ${currentRate.accessorials.reduce((s, a) => s + a.amount, 0).toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>

                    {currentRate.accessorials.length > 0 && (
                        <div style={{
                            borderTop: "1px dashed var(--color-border)",
                            marginTop: 12,
                            paddingTop: 12,
                            display: "flex",
                            flexDirection: "column",
                            gap: 4
                        }}>
                            {currentRate.accessorials.map((acc, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                    <span style={{ color: "var(--color-text-secondary)" }}>• {acc.description}</span>
                                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>${acc.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
                    No rate confirmed yet.
                </div>
            )}

            {/* Historical Version List (Collapsible) */}
            {historicalRates.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-accent)",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            padding: 0
                        }}
                    >
                        {showHistory ? "Hide Version History" : `Show Version History (${historicalRates.length})`}
                    </button>

                    {showHistory && (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginTop: 12,
                            borderLeft: "2px solid var(--color-border)",
                            paddingLeft: 12
                        }}>
                            {historicalRates.map((hist) => (
                                <div key={hist.version} style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                                    <div style={{ fontWeight: 600 }}>v{hist.version} — ${hist.totalRate.toFixed(2)}</div>
                                    <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                                        Base: ${hist.baseRate.toFixed(2)} | Confirmed: {new Date(hist.confirmedAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Confirm New Rate Form */}
            {canConfirmRate && isEligibleState && (
                <form onSubmit={handleSubmit} style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16
                }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                        Confirm New Rate Version
                    </h4>

                    {error && (
                        <div style={{
                            background: "var(--color-error-light)",
                            border: "1px solid var(--color-error)",
                            color: "var(--color-error)",
                            fontSize: 13,
                            borderRadius: "var(--radius-md)",
                            padding: "8px 12px"
                        }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                            Base Rate ($)
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            placeholder="e.g. 1500"
                            value={baseRate}
                            onChange={(e) => setBaseRate(e.target.value)}
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
                        />
                    </div>

                    {/* Accessorials Creator */}
                    <div>
                        <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Accessorial Charges (optional)
                        </label>

                        {accessorials.map((acc, idx) => (
                            <div key={idx} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "var(--color-surface-secondary)",
                                padding: "6px 12px",
                                borderRadius: "var(--radius-sm)",
                                fontSize: 12,
                                marginBottom: 6
                            }}>
                                <span>{acc.description}: <strong>${acc.amount.toFixed(2)}</strong></span>
                                <button
                                    type="button"
                                    onClick={() => removeAccessorial(idx)}
                                    style={{
                                        border: "none",
                                        background: "none",
                                        color: "var(--color-error)",
                                        cursor: "pointer",
                                        fontWeight: 600
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}

                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <input
                                type="text"
                                placeholder="Description (e.g. Tarping)"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                style={{
                                    flex: 2,
                                    background: "var(--color-surface)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "6px 10px",
                                    fontSize: 12,
                                    color: "var(--color-text-primary)"
                                }}
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Amount ($)"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: "var(--color-surface)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "6px 10px",
                                    fontSize: 12,
                                    color: "var(--color-text-primary)"
                                }}
                            />
                            <button
                                type="button"
                                onClick={addAccessorial}
                                style={{
                                    background: "var(--color-surface)",
                                    color: "var(--color-text-primary)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "0 12px",
                                    fontSize: 12,
                                    cursor: "pointer"
                                }}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div style={{
                        borderTop: "1px dashed var(--color-border)",
                        paddingTop: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
                            Total Rate: ${computedTotal.toFixed(2)}
                        </span>
                        <button
                            type="submit"
                            disabled={loading || !baseRate}
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
                            {loading ? "Confirming..." : "Confirm Rate"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
