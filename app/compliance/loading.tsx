import React from "react";

export default function ComplianceLoading() {
    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                .skeleton-pulse {
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>

            <div className="skeleton-pulse" style={{ height: 28, width: 260, background: "var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: 8 }} />
            <div className="skeleton-pulse" style={{ height: 16, width: 450, background: "var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: 24 }} />

            <div
                className="skeleton-pulse"
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    height: 480,
                }}
            />
        </div>
    );
}
