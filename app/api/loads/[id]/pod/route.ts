import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Load } from "@/lib/models/Load";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { canTransition } from "@/lib/state-machine";
import { ApiError, humanReadable, LoadStatus } from "@/types";
import mongoose from "mongoose";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getSessionUser();
        await requirePermission(user, "pod.upload", `/api/loads/${id}/pod`);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid load ID format");
        }

        await connectDB();

        const load = await Load.findById(id);
        if (!load) {
            throw new ApiError(404, "Load not found");
        }

        // 1. Verify load belongs to the user's carrier organization
        if (user!.orgType !== "CARRIER") {
            throw new ApiError(403, "Access denied: only carriers can upload POD");
        }
        if (!load.carrierOrgId || load.carrierOrgId.toString() !== user!.orgId) {
            throw new ApiError(403, "Access denied: load is not assigned to your organization");
        }

        // 2. Validate allowed status transition
        if (!canTransition(load.status as LoadStatus, "POD_VERIFIED")) {
            throw new ApiError(400, `Cannot transition status from ${load.status} to POD_VERIFIED`);
        }

        // 3. Parse file from Request
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            throw new ApiError(400, "No file uploaded");
        }

        // Validate size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new ApiError(400, "File size exceeds 10MB limit");
        }

        // Convert to base64 Data URL
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const mimeType = file.type || "application/pdf";
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // 4. Update load status and store data URL
        const updatePayload = {
            $set: {
                status: "POD_VERIFIED",
                podUrl: dataUrl,
                updatedAt: new Date(),
            },
            $push: {
                statusHistory: {
                    fromStatus: load.status,
                    toStatus: "POD_VERIFIED",
                    changedByUserId: new mongoose.Types.ObjectId(user!.id),
                    changedAt: new Date(),
                    note: "Proof of Delivery uploaded",
                },
            },
        };

        const updatedLoad = await Load.findOneAndUpdate(
            { _id: load._id },
            updatePayload,
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, data: updatedLoad });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[loads/pod POST]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
