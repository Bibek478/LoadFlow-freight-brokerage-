"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface PodPanelProps {
    loadId: string;
    currentStatus: string;
    podUrl: string | null;
    userOrgType: "BROKER" | "CARRIER" | "SHIPPER";
    isOrgAdmin: boolean;
    userPermissions: string[];
}

export default function PodPanel({
    loadId,
    currentStatus,
    podUrl,
    userOrgType,
    isOrgAdmin,
    userPermissions,
}: PodPanelProps) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCarrier = userOrgType === "CARRIER";
    const hasUploadPermission = isCarrier && (isOrgAdmin || userPermissions.includes("pod.upload"));
    const canUpload = hasUploadPermission && currentStatus === "DELIVERED";

    // Helper to open base64 URL in a new tab
    const openInNewTab = () => {
        if (!podUrl) return;
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(
                `<iframe src="${podUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; position:fixed;" allowfullscreen title="Proof of Delivery"></iframe>`
            );
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            // Check size (10MB limit)
            if (selected.size > 10 * 1024 * 1024) {
                setError("File exceeds 10MB limit");
                setFile(null);
            } else {
                setError(null);
                setFile(selected);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/loads/${loadId}/pod`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to upload POD");
            }

            setFile(null);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "An error occurred during upload");
        } finally {
            setLoading(false);
        }
    };

    // Case 1: POD exists. Render viewer for all roles.
    if (podUrl) {
        const isImage = podUrl.startsWith("data:image/");

        return (
            <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: 20
            }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 12 }}>
                    Proof of Delivery (POD)
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {isImage ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={podUrl}
                                alt="Proof of Delivery Preview"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: 220,
                                    objectFit: "contain",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-surface-secondary)"
                                }}
                            />
                            <button
                                onClick={openInNewTab}
                                style={{
                                    background: "var(--color-surface)",
                                    color: "var(--color-text-primary)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "8px 16px",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    textAlign: "center"
                                }}
                            >
                                Open Image in New Tab
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: 12,
                            background: "var(--color-surface-secondary)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)"
                        }}>
                            <div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
                                    📄 Proof of Delivery Document
                                </span>
                                <span style={{ display: "block", fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                                    PDF file uploaded by carrier
                                </span>
                            </div>
                            <button
                                onClick={openInNewTab}
                                style={{
                                    background: "var(--color-accent)",
                                    color: "var(--color-accent-foreground)",
                                    border: "none",
                                    borderRadius: "var(--radius-md)",
                                    padding: "8px 16px",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: "pointer"
                                }}
                            >
                                View PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Case 2: No POD, but user can upload it (Current status: DELIVERED, Role: Carrier)
    if (canUpload) {
        return (
            <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: 20
            }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 12 }}>
                    Upload Proof of Delivery
                </h3>

                {error && (
                    <div style={{
                        background: "var(--color-error-light)",
                        border: "1px solid var(--color-error)",
                        borderRadius: "var(--radius-md)",
                        padding: "10px 12px",
                        color: "var(--color-error)",
                        fontSize: 13,
                        marginBottom: 12
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                            Choose PDF or Image (Max 10MB)
                        </label>
                        <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={handleFileChange}
                            required
                            style={{
                                width: "100%",
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                padding: "8px 12px",
                                fontSize: 13,
                                color: "var(--color-text-primary)",
                                fontFamily: "inherit"
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !file}
                        style={{
                            background: "var(--color-accent)",
                            color: "var(--color-accent-foreground)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            opacity: loading || !file ? 0.7 : 1,
                            textAlign: "center"
                        }}
                    >
                        {loading ? "Uploading & Verifying..." : "Upload POD & Verify Delivery"}
                    </button>
                </form>
            </div>
        );
    }

    // Case 3: Load is delivered / transit, but POD not uploaded yet, and user doesn't have upload permission.
    if (["DELIVERED", "POD_VERIFIED"].includes(currentStatus) || (podUrl === null && currentStatus === "IN_TRANSIT")) {
        return (
            <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: 20
            }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>
                    Proof of Delivery (POD)
                </h3>
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    {currentStatus === "DELIVERED"
                        ? "Pending carrier upload of Proof of Delivery."
                        : "Proof of Delivery will be required once load is delivered."}
                </span>
            </div>
        );
    }

    return null;
}
