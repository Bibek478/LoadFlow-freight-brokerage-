"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        setLoading(false);

        if (!data.success) {
            setError(data.error ?? "Login failed");
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
                    maxWidth: 400,
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 32,
                }}
            >
                <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "var(--color-text-primary)" }}>
                    Sign in to LoadFlow
                </h1>
                <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24 }}>
                    Enter your credentials to continue
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                            placeholder="you@company.com"
                        />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ ...inputStyle, paddingRight: 40 }}
                                placeholder="••••••••"
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
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                                        <line x1="2" y1="2" x2="22" y2="22"/>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={errorStyle}>{error}</div>
                    )}

                    <button
                        id="login-submit"
                        type="submit"
                        disabled={loading}
                        style={primaryButtonStyle(loading)}
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
                    No account?{" "}
                    <Link href="/signup/broker" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
                        Broker
                    </Link>
                    {" / "}
                    <Link href="/signup/carrier" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
                        Carrier
                    </Link>
                    {" / "}
                    <Link href="/signup/shipper" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
                        Shipper
                    </Link>
                </div>
            </div>
        </div>
    );
}

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
        transition: "opacity 0.15s",
        opacity: disabled ? 0.7 : 1,
    };
}
