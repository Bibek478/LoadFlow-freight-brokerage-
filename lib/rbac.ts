import { ApiError } from "@/types";
import type { Permission, OrgType, SessionUser } from "@/types";
import { connectDB } from "@/lib/db";
import { AccessDeniedLog } from "@/lib/models/AccessDeniedLog";

export { type Permission };

export function hasPermission(user: SessionUser, permission: Permission): boolean {
    if (user.orgType === "SHIPPER") return false;
    if (user.isOrgAdmin) return true;
    return user.permissions.includes(permission);
}

export async function requirePermission(
    user: SessionUser | null,
    permission: Permission,
    route: string
): Promise<void> {
    if (!user || !hasPermission(user, permission)) {
        await logAccessDenied(user?.id ?? null, permission, route);
        throw new ApiError(403, "Not authorized");
    }
}

export async function logAccessDenied(
    userId: string | null,
    attemptedPermission: string,
    route: string
): Promise<void> {
    try {
        await connectDB();
        await AccessDeniedLog.create({ userId, attemptedPermission, route });
    } catch {
        // Non-fatal — log silently
        console.error("[rbac] logAccessDenied failed");
    }
}

// Object-level scoping helpers — always applied on queries

export function scopeLoadsWhere(user: SessionUser): Record<string, unknown> {
    if (user.orgType === "SHIPPER") return { shipperId: user.id };
    if (user.orgType === "CARRIER") return { carrierOrgId: user.orgId };
    return { brokerOrgId: user.orgId }; // BROKER
}

export function scopeStaffWhere(user: SessionUser): Record<string, unknown> {
    // Staff list is always scoped to the same org
    return { orgId: user.orgId };
}

export function scopeRolesWhere(user: SessionUser): Record<string, unknown> {
    return { orgId: user.orgId };
}

export function scopeComplianceWhere(user: SessionUser): Record<string, unknown> {
    // Carrier sees only their own compliance record
    return { carrierOrgId: user.orgId };
}

// Permission catalog per org type (for role builder UI)
export const PERMISSIONS_FOR_ORG: Record<Exclude<OrgType, "SHIPPER">, Permission[]> = {
    BROKER: [
        "load.create",
        "load.assign_carrier",
        "load.override_compliance_flag",
        "rate.confirm",
        "staff.manage",
    ],
    CARRIER: ["load.update_status", "pod.upload", "staff.manage"],
};
