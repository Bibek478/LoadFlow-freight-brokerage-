import React from "react";

export default function StaffLoading() {
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

            <div className="skeleton-pulse" style={{ height: 28, width: 220, background: "var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: 8 }} />
            <div className="skeleton-pulse" style={{ height: 16, width: 300, background: "var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: 24 }} />

            {/* Tab buttons */}
            <div style={{ display: "flex", gap: 16, borderBottom: "1px solid var(--color-border)", paddingBottom: 1, marginBottom: 24 }}>
                <div className="skeleton-pulse" style={{ height: 32, width: 120, background: "var(--color-border)", borderRadius: "var(--radius-md)" }} />
                <div className="skeleton-pulse" style={{ height: 32, width: 80, background: "var(--color-border)", borderRadius: "var(--radius-md)" }} />
            </div>

            {/* Two panel layout */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div
                    className="skeleton-pulse"
                    style={{
                        flex: 2,
                        minWidth: 300,
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        height: 320,
                    }}
                />
                <div
                    className="skeleton-pulse"
                    style={{
                        flex: 1,
                        minWidth: 300,
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        height: 320,
                    }}
                />
            </div>
        </div>
    );
}
