"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionUser, Permission } from "@/types";
import { PERMISSIONS_FOR_ORG, PERMISSION_LABELS } from "@/types";
import RoleBuilder from "./RoleBuilder";
import StaffForm from "./StaffForm";
import StaffList from "./StaffList";

interface Role {
    _id: string;
    name: string;
    permissions: Permission[];
}

interface StaffMember {
    _id: string;
    name: string;
    email: string;
    roleName: string | null;
    createdAt: string;
}

interface StaffPageClientProps {
    user: SessionUser;
}

type Tab = "staff" | "roles";

export default function StaffPageClient({ user }: StaffPageClientProps) {
    const [tab, setTab] = useState<Tab>("staff");
    const [roles, setRoles] = useState<Role[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);

    const orgType = user.orgType as "BROKER" | "CARRIER";
    const availablePerms = PERMISSIONS_FOR_ORG[orgType];

    const fetchRoles = useCallback(async () => {
        const res = await fetch("/api/roles");
        const data = await res.json();
        if (data.success) setRoles(data.data);
    }, []);

    const fetchStaff = useCallback(async () => {
        const res = await fetch("/api/staff");
        const data = await res.json();
        if (data.success) setStaff(data.data);
    }, []);

    useEffect(() => {
        void fetchRoles();
        void fetchStaff();
    }, [fetchRoles, fetchStaff]);

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        background: "none",
        border: "none",
        borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
        fontFamily: "inherit",
        marginBottom: -1,
    });

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
                Staff & Role Management
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24 }}>
                Admin panel — create roles and add staff members
            </p>

            {/* Tabs */}
            <div
                style={{
                    display: "flex",
                    borderBottom: "1px solid var(--color-border)",
                    marginBottom: 24,
                }}
            >
                <button style={tabStyle(tab === "staff")} onClick={() => setTab("staff")}>
                    Staff Members
                </button>
                <button style={tabStyle(tab === "roles")} onClick={() => setTab("roles")}>
                    Roles
                </button>
            </div>

            {tab === "staff" && (
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    {/* Current staff */}
                    <div
                        style={{
                            flex: 2,
                            minWidth: 300,
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            padding: 20,
                        }}
                    >
                        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--color-text-primary)" }}>
                            Current Staff ({staff.length})
                        </h2>
                        <StaffList staff={staff} />
                    </div>

                    {/* Create staff */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 300,
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            padding: 20,
                        }}
                    >
                        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--color-text-primary)" }}>
                            Add Staff Member
                        </h2>
                        <StaffForm roles={roles} onStaffCreated={fetchStaff} />
                    </div>
                </div>
            )}

            {tab === "roles" && (
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    {/* Existing roles */}
                    <div
                        style={{
                            flex: 2,
                            minWidth: 300,
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            padding: 20,
                        }}
                    >
                        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--color-text-primary)" }}>
                            Existing Roles ({roles.length})
                        </h2>
                        {roles.length === 0 ? (
                            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>No roles yet. Create one on the right.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {roles.map((r) => (
                                    <div
                                        key={r._id}
                                        style={{
                                            padding: "12px 16px",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-md)",
                                            background: "var(--color-surface-secondary)",
                                        }}
                                    >
                                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: "var(--color-text-primary)" }}>
                                            {r.name}
                                        </p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {r.permissions.map((p) => (
                                                <span
                                                    key={p}
                                                    style={{
                                                        fontSize: 11,
                                                        padding: "2px 8px",
                                                        background: "var(--color-accent-light)",
                                                        color: "var(--color-accent)",
                                                        borderRadius: "var(--radius-full)",
                                                    }}
                                                >
                                                    {PERMISSION_LABELS[p] || p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create role */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 300,
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            padding: 20,
                        }}
                    >
                        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--color-text-primary)" }}>
                            Create Role
                        </h2>
                        <RoleBuilder
                            availablePermissions={availablePerms}
                            onRoleCreated={fetchRoles}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
