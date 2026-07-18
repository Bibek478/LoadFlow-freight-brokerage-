import React from "react";

export default function DashboardLoading() {
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

            {/* Title Skeleton */}
            <div className="skeleton-pulse" style={{ height: 28, width: 200, background: "var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: 8 }} />
            <div className="skeleton-pulse" style={{ height: 16, width: 320, background: "var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: 32 }} />

            {/* Stats Cards Skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="skeleton-pulse"
                        style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            padding: 20,
                            height: 104,
                        }}
                    />
                ))}
            </div>

            {/* Table Skeleton */}
            <div
                className="skeleton-pulse"
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20,
                    height: 300,
                }}
            />
        </div>
    );
}
