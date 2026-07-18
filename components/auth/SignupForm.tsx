"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SignupFormProps {
    orgType: "broker" | "carrier" | "shipper";
    title: string;
    subtitle: string;
}

export default function SignupForm({ orgType, title, subtitle }: SignupFormProps) {
    const router = useRouter();
    const isSingleUser = orgType === "shipper";

    const [orgName, setOrgName] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const endpoint = isSingleUser
            ? "/api/auth/signup/shipper"
            : `/api/auth/signup/${orgType}`;

        const body = isSingleUser
            ? { name, email, password }
            : { orgName, name, email, password };

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        setLoading(false);

        if (!data.success) {
            setError(data.error ?? "Signup failed");
            return;
        }

        router.push("/dashboard");
        router.refresh();
    }

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "calc(100vh - 60px)",
                padding: 24,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 420,
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 32,
                }}
            >
                <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "var(--color-text-primary)" }}>
                    {title}
                </h1>
                <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24 }}>
                    {subtitle}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isSingleUser && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>
                                {orgType === "broker" ? "Brokerage Name" : "Carrier Company Name"}
                            </label>
                            <input
                                id="signup-org-name"
                                type="text"
                                required
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                style={inputStyle}
                                placeholder="ACME Freight"
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Your Name</label>
                        <input
                            id="signup-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={inputStyle}
                            placeholder="Jane Smith"
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Email</label>
                        <input
                            id="signup-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                            placeholder="you@company.com"
                        />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            placeholder="min 8 characters"
                        />
                    </div>

                    {error && <div style={errorStyle}>{error}</div>}

                    <button
                        id="signup-submit"
                        type="submit"
                        disabled={loading}
                        style={primaryButtonStyle(loading)}
                    >
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </form>

                <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
                        Sign in
                    </Link>
                </p>
            </div>
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
    marginBottom: 16,
    padding: "10px 12px",
    background: "var(--color-error-light)",
    border: "1px solid var(--color-error)",
    borderRadius: "var(--radius-md)",
    color: "var(--color-error)",
    fontSize: 13,
};

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
    return {
        width: "100%",
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
    };
}
