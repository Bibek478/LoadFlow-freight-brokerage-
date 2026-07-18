"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ShipperOption {
    id: string;
    name: string;
    email: string;
}

interface LoadFormProps {
    shippers: ShipperOption[];
}

export default function LoadForm({ shippers }: LoadFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        shipperId: "",
        origin: "",
        destination: "",
        commodityType: "",
        equipmentType: "",
        pickupDate: "",
        deliveryDate: "",
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/loads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shipperId: form.shipperId,
                    origin: form.origin,
                    destination: form.destination,
                    commodityType: form.commodityType,
                    equipmentType: form.equipmentType,
                    pickupDate: form.pickupDate,
                    deliveryDate: form.deliveryDate || null,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to create load");
            }

            router.push(`/loads/${data.data._id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            maxWidth: 600,
            margin: "0 auto"
        }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
                Post New Load
            </h2>

            {error && (
                <div style={{
                    background: "var(--color-error-light)",
                    border: "1px solid var(--color-error)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    color: "var(--color-error)",
                    fontSize: 13,
                    marginBottom: 20
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                        Shipper Contact
                    </label>
                    <select
                        required
                        value={form.shipperId}
                        onChange={(e) => setForm({ ...form, shipperId: e.target.value })}
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
                        <option value="">Select a shipper...</option>
                        {shippers.map((shipper) => (
                            <option key={shipper.id} value={shipper.id}>
                                {shipper.name} ({shipper.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Origin City, ST
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Chicago, IL"
                            value={form.origin}
                            onChange={(e) => setForm({ ...form, origin: e.target.value })}
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
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Destination City, ST
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Dallas, TX"
                            value={form.destination}
                            onChange={(e) => setForm({ ...form, destination: e.target.value })}
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
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Commodity Type
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Produce"
                            value={form.commodityType}
                            onChange={(e) => setForm({ ...form, commodityType: e.target.value })}
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
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Equipment Type
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Reefer"
                            value={form.equipmentType}
                            onChange={(e) => setForm({ ...form, equipmentType: e.target.value })}
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
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Pickup Date
                        </label>
                        <input
                            type="date"
                            required
                            value={form.pickupDate}
                            onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
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
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Delivery Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={form.deliveryDate}
                            onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
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
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        background: "var(--color-accent)",
                        color: "var(--color-accent-foreground)",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        padding: "10px 16px",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        opacity: loading ? 0.7 : 1,
                        marginTop: 8
                    }}
                >
                    {loading ? "Posting..." : "Post Load"}
                </button>
            </form>
        </div>
    );
}
