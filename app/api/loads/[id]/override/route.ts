import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Load } from "@/lib/models/Load";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { ApiError, humanReadable } from "@/types";
import mongoose from "mongoose";

const overrideSchema = z.object({
    note: z.string().min(1, "Override note is required"),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getSessionUser();
        await requirePermission(
            user,
            "load.override_compliance_flag",
            `/api/loads/${id}/override`
        );

        const body = overrideSchema.parse(await req.json());
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid load ID format");
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

        // 2. Check if compliance is actually flagged
        if (!load.complianceFlagged) {
            throw new ApiError(400, "Load is not currently flagged for compliance");
        }

        // 3. Atomic clear of complianceFlagged & push to statusHistory
        const updatedLoad = await Load.findOneAndUpdate(
            { _id: load._id },
            {
                $set: {
                    complianceFlagged: false,
                    complianceFlagReason: null,
                    updatedAt: new Date(),
                },
                $push: {
                    statusHistory: {
                        fromStatus: load.status,
                        toStatus: load.status,
                        changedByUserId: new mongoose.Types.ObjectId(user!.id),
                        changedAt: new Date(),
                        note: `Compliance flag overridden: ${body.note}`,
                    },
                },
            },
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, data: updatedLoad });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[loads/override POST]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
