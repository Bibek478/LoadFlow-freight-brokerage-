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
    const [showPassword, setShowPassword] = useState(false);
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
                        <div style={{ position: "relative" }}>
                            <input
                                id="signup-password"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ ...inputStyle, paddingRight: 40 }}
                                placeholder="min 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--color-text-secondary)",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: 4
                                }}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                        <line x1="2" y1="2" x2="22" y2="22" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
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
