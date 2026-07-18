import React from "react";

export default function LoadDetailLoading() {
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

            {/* Breadcrumb Skeleton */}
            <div className="skeleton-pulse" style={{ height: 18, width: 240, background: "var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: 20 }} />

            {/* Header Skeleton */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <div className="skeleton-pulse" style={{ height: 32, width: 300, background: "var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: 8 }} />
                    <div className="skeleton-pulse" style={{ height: 18, width: 400, background: "var(--color-border)", borderRadius: "var(--radius-md)" }} />
                </div>
                <div className="skeleton-pulse" style={{ height: 36, width: 120, background: "var(--color-border)", borderRadius: "var(--radius-full)" }} />
            </div>

            {/* Content Layout Skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
                {/* Left Col - Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div
                        className="skeleton-pulse"
                        style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            height: 250,
                        }}
                    />
                    <div
                        className="skeleton-pulse"
                        style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            height: 180,
                        }}
                    />
                </div>

                {/* Right Col - Sidebar Actions */}
                <div
                    className="skeleton-pulse"
                    style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        height: 350,
                    }}
                />
            </div>
        </div>
    );
}
