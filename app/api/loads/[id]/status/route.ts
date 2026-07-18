import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Load } from "@/lib/models/Load";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { canTransition } from "@/lib/state-machine";
import { ApiError, humanReadable, LoadStatus } from "@/types";
import mongoose from "mongoose";

const statusSchema = z.object({
    status: z.enum([
        "POSTED",
        "CARRIER_ASSIGNED",
        "RATE_CONFIRMED",
        "DISPATCHED",
        "IN_TRANSIT",
        "DELIVERED",
        "POD_VERIFIED",
        "INVOICED_CLOSED"
    ]),
    note: z.string().optional().nullable(),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getSessionUser();
        await requirePermission(user, "load.update_status", `/api/loads/${id}/status`);

        const body = statusSchema.parse(await req.json());
        const targetStatus = body.status;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid load ID format");
        }

        await connectDB();

        const load = await Load.findById(id);
        if (!load) {
            throw new ApiError(404, "Load not found");
        }

        // 1. Validate dedicated API routes are not bypassed
        if (targetStatus === "CARRIER_ASSIGNED") {
            throw new ApiError(400, "Use carrier assignment endpoint instead");
        }
        if (targetStatus === "RATE_CONFIRMED") {
            throw new ApiError(400, "Use rate confirmation endpoint instead");
        }

        // 2. Validate allowed status transition
        if (!canTransition(load.status as LoadStatus, targetStatus)) {
            throw new ApiError(400, `Cannot transition status from ${load.status} to ${targetStatus}`);
        }

        // 3. Enforce ownership and scoping per transition
        if (targetStatus === "INVOICED_CLOSED") {
            // Broker action
            if (user!.orgType !== "BROKER") {
                throw new ApiError(403, "Access denied: only brokers can invoice/close loads");
            }
            if (load.brokerOrgId.toString() !== user!.orgId) {
                throw new ApiError(403, "Access denied: load belongs to another broker");
            }
        } else {
            // Carrier action (POSTED - decline, DISPATCHED, IN_TRANSIT, DELIVERED, POD_VERIFIED)
            if (user!.orgType !== "CARRIER") {
                throw new ApiError(403, "Access denied: only carriers can update transit status");
            }
            if (!load.carrierOrgId || load.carrierOrgId.toString() !== user!.orgId) {
                throw new ApiError(403, "Access denied: load is not assigned to your organization");
            }
        }

        // 4. Perform atomic update based on transition
        let updatePayload: any = {};
        if (targetStatus === "POSTED") {
            // Carrier declined assignment: status goes back to POSTED, carrier link is severed, compliance flag is reset
            updatePayload = {
                $set: {
                    status: "POSTED",
                    carrierOrgId: null,
                    complianceFlagged: false,
                    complianceFlagReason: null,
                    updatedAt: new Date(),
                },
                $push: {
                    statusHistory: {
                        fromStatus: load.status,
                        toStatus: "POSTED",
                        changedByUserId: new mongoose.Types.ObjectId(user!.id),
                        changedAt: new Date(),
                        note: body.note || "Carrier declined assignment",
                    },
                },
            };
        } else {
            // Standard transit status transition
            updatePayload = {
                $set: {
                    status: targetStatus,
                    updatedAt: new Date(),
                },
                $push: {
                    statusHistory: {
                        fromStatus: load.status,
                        toStatus: targetStatus,
                        changedByUserId: new mongoose.Types.ObjectId(user!.id),
                        changedAt: new Date(),
                        note: body.note || null,
                    },
                },
            };
        }

        const updatedLoad = await Load.findOneAndUpdate(
            { _id: load._id },
            updatePayload,
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, data: updatedLoad });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[loads/status POST]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
