import type { LoadStatus } from "@/types";

// Valid transitions per the architecture spec
export const ALLOWED_TRANSITIONS: Record<LoadStatus, LoadStatus[]> = {
    POSTED: ["CARRIER_ASSIGNED"],
    CARRIER_ASSIGNED: ["RATE_CONFIRMED", "POSTED"], // POSTED = carrier declined
    RATE_CONFIRMED: ["DISPATCHED"],
    DISPATCHED: ["IN_TRANSIT"],
    IN_TRANSIT: ["DELIVERED"],
    DELIVERED: ["POD_VERIFIED", "INVOICED_CLOSED"], // POD_VERIFIED is stretch; direct close allowed
    POD_VERIFIED: ["INVOICED_CLOSED"],
    INVOICED_CLOSED: [],
};

export function canTransition(from: LoadStatus, to: LoadStatus): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
