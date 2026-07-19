export type Permission =
    | "load.create"
    | "load.assign_carrier"
    | "load.override_compliance_flag"
    | "rate.confirm"
    | "load.update_status"
    | "staff.manage"
    | "pod.upload";

export type OrgType = "BROKER" | "CARRIER" | "SHIPPER";

export type LoadStatus =
    | "POSTED"
    | "CARRIER_ASSIGNED"
    | "RATE_CONFIRMED"
    | "DISPATCHED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "POD_VERIFIED"
    | "INVOICED_CLOSED";

export type SessionUser = {
    id: string;
    orgId: string | null;
    orgType: OrgType;
    isOrgAdmin: boolean;
    permissions: Permission[];
    name: string;
};

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = "ApiError";
    }
}

export function humanReadable(error: unknown): string {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred";
}

// Permission catalog by org type
export const BROKER_PERMISSIONS: Permission[] = [
    "load.create",
    "load.assign_carrier",
    "load.override_compliance_flag",
    "rate.confirm",
    "staff.manage",
];

export const CARRIER_PERMISSIONS: Permission[] = [
    "load.update_status",
    "pod.upload",
    "staff.manage",
];

export const PERMISSIONS_FOR_ORG: Record<Exclude<OrgType, "SHIPPER">, Permission[]> = {
    BROKER: BROKER_PERMISSIONS,
    CARRIER: CARRIER_PERMISSIONS,
};

export const PERMISSION_LABELS: Record<Permission, string> = {
    "load.create": "Create Loads",
    "load.assign_carrier": "Assign Carrier",
    "load.override_compliance_flag": "Override Compliance Flag",
    "rate.confirm": "Confirm Rates",
    "load.update_status": "Update Load Status",
    "staff.manage": "Manage Staff & Roles",
    "pod.upload": "Upload POD",
};


