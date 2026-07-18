import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Load } from "@/lib/models/Load";
import { Org } from "@/lib/models/Org";
import { CarrierComplianceRecord } from "@/lib/models/CarrierComplianceRecord";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { canTransition } from "@/lib/state-machine";
import { ApiError, humanReadable } from "@/types";
import mongoose from "mongoose";

const assignSchema = z.object({
    carrierOrgId: z.string().min(1),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getSessionUser();
        await requirePermission(user, "load.assign_carrier", `/api/loads/${id}/assign`);

        const body = assignSchema.parse(await req.json());
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(body.carrierOrgId)) {
            throw new ApiError(400, "Invalid ID format");
        }

        await connectDB();

        // 1. Fetch load & verify scope
        const load = await Load.findById(id);
        if (!load) {
            throw new ApiError(404, "Load not found");
        }

        if (load.brokerOrgId.toString() !== user!.orgId) {
            throw new ApiError(403, "Access denied: load belongs to another broker");
        }

        // 2. Validate state transition
        if (!canTransition(load.status, "CARRIER_ASSIGNED")) {
            throw new ApiError(400, `Cannot transition from ${load.status} to CARRIER_ASSIGNED`);
        }

        // 3. Verify carrier organisation exists and is carrier
        const carrierOrgIdObj = new mongoose.Types.ObjectId(body.carrierOrgId);
        const carrierOrg = await Org.findById(carrierOrgIdObj).lean();
        if (!carrierOrg || carrierOrg.type !== "CARRIER") {
            throw new ApiError(400, "Invalid carrier organization");
        }

        // 4. Run compliance checks
        const compliance = await CarrierComplianceRecord.findOne({
            carrierOrgId: carrierOrgIdObj,
        }).lean();

        let flagged = false;
        const reasons: string[] = [];

        if (!compliance) {
            flagged = true;
            reasons.push("Compliance record not found.");
        } else {
            if (compliance.mcDotStatus !== "ACTIVE") {
                flagged = true;
                reasons.push(`Authority status is ${compliance.mcDotStatus}.`);
            }
            if (new Date(compliance.insuranceExpiry) < new Date()) {
                flagged = true;
                reasons.push("Insurance has expired.");
            }
            if (!compliance.approvedEquipmentTypes.includes(load.equipmentType)) {
                flagged = true;
                reasons.push(`Equipment type '${load.equipmentType}' is not approved.`);
            }
            if (!compliance.approvedCommodityTypes.includes(load.commodityType)) {
                flagged = true;
                reasons.push(`Commodity type '${load.commodityType}' is not approved.`);
            }
        }

        const flagReason = flagged ? reasons.join(" ") : null;

        // 5. Atomic write: update status, carrier, compliance flags, statusHistory audit
        const updatedLoad = await Load.findOneAndUpdate(
            { _id: load._id },
            {
                $set: {
                    status: "CARRIER_ASSIGNED",
                    carrierOrgId: carrierOrgIdObj,
                    complianceFlagged: flagged,
                    complianceFlagReason: flagReason,
                    updatedAt: new Date(),
                },
                $push: {
                    statusHistory: {
                        fromStatus: load.status,
                        toStatus: "CARRIER_ASSIGNED",
                        changedByUserId: new mongoose.Types.ObjectId(user!.id),
                        changedAt: new Date(),
                        note: flagged
                            ? `Carrier assigned with compliance flags: ${flagReason}`
                            : "Carrier assigned (compliant)",
                    },
                },
            },
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, data: updatedLoad });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[loads/assign POST]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
