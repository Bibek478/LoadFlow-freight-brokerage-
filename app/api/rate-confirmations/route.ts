import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Load } from "@/lib/models/Load";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { ApiError, humanReadable } from "@/types";

const rateConfirmationSchema = z.object({
    loadId: z.string().min(1),
    baseRate: z.number().nonnegative(),
    accessorials: z
        .array(
            z.object({
                description: z.string().min(1),
                amount: z.number().nonnegative(),
            })
        )
        .default([]),
});

export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) {
            throw new ApiError(401, "Unauthorized");
        }

        const { searchParams } = new URL(req.url);
        const loadId = searchParams.get("loadId");
        if (!loadId) {
            throw new ApiError(400, "Missing loadId parameter");
        }

        await connectDB();

        const load = await Load.findById(loadId).lean();
        if (!load) {
            throw new ApiError(404, "Load not found");
        }

        // Scope check based on org type
        if (user.orgType === "BROKER" && load.brokerOrgId.toString() !== user.orgId) {
            throw new ApiError(403, "Access denied");
        }
        if (user.orgType === "CARRIER" && load.carrierOrgId?.toString() !== user.orgId) {
            throw new ApiError(403, "Access denied");
        }
        if (user.orgType === "SHIPPER" && load.shipperId.toString() !== user.id) {
            throw new ApiError(403, "Access denied");
        }

        return NextResponse.json({ success: true, data: load.rateConfirmations ?? [] });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[rate-confirmations GET]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser();
        await requirePermission(user, "rate.confirm", "/api/rate-confirmations");

        const body = rateConfirmationSchema.parse(await req.json());
        await connectDB();

        const load = await Load.findById(body.loadId);
        if (!load) {
            throw new ApiError(404, "Load not found");
        }

        // Scope check
        if (load.brokerOrgId.toString() !== user!.orgId) {
            throw new ApiError(403, "Access denied: load belongs to another broker");
        }

        // Compliance check
        if (load.complianceFlagged) {
            throw new ApiError(400, "Cannot confirm rate: carrier has active compliance flag");
        }

        // Status check
        if (load.status !== "CARRIER_ASSIGNED" && load.status !== "RATE_CONFIRMED") {
            throw new ApiError(400, "Cannot confirm rate in current load status");
        }

        const accessorialsSum = body.accessorials.reduce((sum, item) => sum + item.amount, 0);
        const totalRate = body.baseRate + accessorialsSum;

        // Mark all existing rate confirmations as isCurrent = false
        await Load.updateOne(
            { _id: load._id },
            { $set: { "rateConfirmations.$[].isCurrent": false } }
        );

        // Fetch fresh state to get length for version
        const freshLoad = await Load.findById(load._id).lean();
        if (!freshLoad) {
            throw new ApiError(404, "Load not found after updates");
        }
        const version = (freshLoad.rateConfirmations?.length ?? 0) + 1;

        const updatePayload: any = {
            $push: {
                rateConfirmations: {
                    version,
                    baseRate: body.baseRate,
                    accessorials: body.accessorials,
                    totalRate,
                    confirmedByUserId: user!.id,
                    confirmedAt: new Date(),
                    isCurrent: true,
                },
            },
        };

        // Transition status if currently CARRIER_ASSIGNED
        if (freshLoad.status === "CARRIER_ASSIGNED") {
            updatePayload.$set = { status: "RATE_CONFIRMED", updatedAt: new Date() };
            updatePayload.$push.statusHistory = {
                fromStatus: "CARRIER_ASSIGNED",
                toStatus: "RATE_CONFIRMED",
                changedByUserId: user!.id,
                changedAt: new Date(),
                note: `Rate confirmed version ${version}`,
            };
        } else {
            updatePayload.$set = { updatedAt: new Date() };
        }

        const updatedLoad = await Load.findOneAndUpdate(
            { _id: load._id },
            updatePayload,
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, data: updatedLoad });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[rate-confirmations POST]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
