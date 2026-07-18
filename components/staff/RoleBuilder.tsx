"use client";

import { useState } from "react";
import type { Permission } from "@/types";

const ALL_LABELS: Record<Permission, string> = {
    "load.create": "Create Loads",
    "load.assign_carrier": "Assign Carrier",
    "load.override_compliance_flag": "Override Compliance Flag",
    "rate.confirm": "Confirm Rates",
    "load.update_status": "Update Load Status",
    "staff.manage": "Manage Staff & Roles",
    "pod.upload": "Upload POD",
};

interface RoleBuilderProps {
    availablePermissions: Permission[];
    onRoleCreated: () => void;
}

export default function RoleBuilder({ availablePermissions, onRoleCreated }: RoleBuilderProps) {
    const [name, setName] = useState("");
    const [selected, setSelected] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function toggle(p: Permission) {
        setSelected((prev) =>
            prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || selected.length === 0) {
            setError("Name and at least one permission required");
            return;
        }
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch("/api/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, permissions: selected }),
        });
        const data = await res.json();
        setLoading(false);

        if (!data.success) {
            setError(data.error ?? "Failed to create role");
            return;
        }

        setSuccess(`Role "${name}" created`);
        setName("");
        setSelected([]);
        onRoleCreated();
    }

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Role Name</label>
                <input
                    id="role-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dispatcher"
                    style={inputStyle}
                    required
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Permissions</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    {availablePermissions.map((p) => (
                        <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                            <input
                                type="checkbox"
                                checked={selected.includes(p)}
                                onChange={() => toggle(p)}
                                id={`perm-${p}`}
                                style={{ accentColor: "var(--color-accent)" }}
                            />
                            <span style={{ color: "var(--color-text-primary)" }}>{ALL_LABELS[p]}</span>
                            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>({p})</span>
                        </label>
                    ))}
                </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}
            {success && (
                <div style={{ ...errorStyle, background: "var(--color-success-light)", border: "1px solid var(--color-success)", color: "var(--color-success)" }}>
                    {success}
                </div>
            )}

            <button
                id="role-create-submit"
                type="submit"
                disabled={loading}
                style={btnStyle(loading)}
            >
                {loading ? "Creating…" : "Create Role"}
            </button>
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

const errorStyle: React.CSSProperties = {
    marginBottom: 12,
    padding: "10px 12px",
    background: "var(--color-error-light)",
    border: "1px solid var(--color-error)",
    borderRadius: "var(--radius-md)",
    color: "var(--color-error)",
    fontSize: 13,
};

function btnStyle(disabled: boolean): React.CSSProperties {
    return {
        padding: "9px 20px",
        background: disabled ? "var(--color-accent-light)" : "var(--color-accent)",
        color: "var(--color-accent-foreground)",
        border: "none",
        borderRadius: "var(--radius-md)",
        fontWeight: 500,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.7 : 1,
    };
}
