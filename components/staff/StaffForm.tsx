"use client";

import { useState } from "react";

interface Role {
    _id: string;
    name: string;
}

interface StaffFormProps {
    roles: Role[];
    onStaffCreated: () => void;
}

export default function StaffForm({ roles, onStaffCreated }: StaffFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [roleId, setRoleId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [created, setCreated] = useState<{ name: string; email: string; tempPassword: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setCreated(null);

        const res = await fetch("/api/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, roleId }),
        });
        const data = await res.json();
        setLoading(false);

        if (!data.success) {
            setError(data.error ?? "Failed to create staff");
            return;
        }

        setCreated({ name: data.data.name, email: data.data.email, tempPassword: data.data.tempPassword });
        setName("");
        setEmail("");
        setPassword("");
        setRoleId("");
        onStaffCreated();
    }

    return (
        <div>
            {created && (
                <div
                    style={{
                        marginBottom: 20,
                        padding: "14px 16px",
                        background: "var(--color-success-light)",
                        border: "1px solid var(--color-success)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--color-success)",
                        fontSize: 13,
                    }}
                >
                    <strong>{created.name}</strong> created ({created.email}). Temp password:{" "}
                    <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 4px", borderRadius: 3 }}>
                        {created.tempPassword}
                    </code>
                    . Share once, this {"won't"} be shown again.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                        <label style={labelStyle}>Name</label>
                        <input
                            id="staff-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={inputStyle}
                            placeholder="Jane Smith"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input
                            id="staff-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                            placeholder="jane@company.com"
                        />
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                        <label style={labelStyle}>Temp Password</label>
                        <input
                            id="staff-password"
                            type="text"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            placeholder="min 6 chars"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Role</label>
                        <select
                            id="staff-role"
                            required
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            style={{ ...inputStyle, background: "var(--color-surface)" }}
                        >
                            <option value="">Select a role…</option>
                            {roles.map((r) => (
                                <option key={r._id} value={r._id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <div style={errorStyle}>{error}</div>}

                <button
                    id="staff-create-submit"
                    type="submit"
                    disabled={loading || roles.length === 0}
                    style={btnStyle(loading || roles.length === 0)}
                >
                    {loading ? "Creating…" : "Create Staff Member"}
                </button>

                {roles.length === 0 && (
                    <p style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-muted)" }}>
                        Create at least one role first.
                    </p>
                )}
            </form>
        </div>
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
