import React from "react";

export default function LoadsLoading() {
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

            {/* Title & Button Skeleton */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <div className="skeleton-pulse" style={{ height: 28, width: 180, background: "var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: 8 }} />
                    <div className="skeleton-pulse" style={{ height: 16, width: 280, background: "var(--color-border)", borderRadius: "var(--radius-md)" }} />
                </div>
                <div className="skeleton-pulse" style={{ height: 40, width: 140, background: "var(--color-border)", borderRadius: "var(--radius-md)" }} />
            </div>

            {/* Filter Bar Skeleton */}
            <div
                className="skeleton-pulse"
                style={{
                    height: 56,
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: 24,
                }}
            />

            {/* Table Skeleton */}
            <div
                className="skeleton-pulse"
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20,
                    height: 400,
                }}
            />
        </div>
    );
}
