import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Load } from "@/lib/models/Load";
import { User } from "@/lib/models/User";
import { getSessionUser } from "@/lib/auth";
import { requirePermission, scopeLoadsWhere } from "@/lib/rbac";
import { ApiError, humanReadable } from "@/types";
import mongoose from "mongoose";

const createSchema = z.object({
    shipperId: z.string().min(1),
    origin: z.string().min(1),
    destination: z.string().min(1),
    commodityType: z.string().min(1),
    equipmentType: z.string().min(1),
    pickupDate: z.string().transform((val) => new Date(val)),
    deliveryDate: z
        .string()
        .nullable()
        .optional()
        .transform((val) => (val ? new Date(val) : null)),
});

export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) {
            throw new ApiError(401, "Unauthorized");
        }

        await connectDB();

        const filter = scopeLoadsWhere(user);
        const loads = await Load.find(filter).sort({ createdAt: -1 }).lean();

        return NextResponse.json({ success: true, data: loads });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[loads GET]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser();
        await requirePermission(user, "load.create", "/api/loads");

        const body = createSchema.parse(await req.json());
        await connectDB();

        // Code-level FK check: verify shipper exists and is shipper
        if (!mongoose.Types.ObjectId.isValid(body.shipperId)) {
            throw new ApiError(400, "Invalid shipper format");
        }
        const shipper = await User.findOne({
            _id: new mongoose.Types.ObjectId(body.shipperId),
            orgType: "SHIPPER",
        }).lean();

        if (!shipper) {
            throw new ApiError(400, "Shipper user not found");
        }

        const newLoad = await Load.create({
            brokerOrgId: new mongoose.Types.ObjectId(user!.orgId!),
            shipperId: new mongoose.Types.ObjectId(body.shipperId),
            carrierOrgId: null,
            status: "POSTED",
            origin: body.origin,
            destination: body.destination,
            commodityType: body.commodityType,
            equipmentType: body.equipmentType,
            pickupDate: body.pickupDate,
            deliveryDate: body.deliveryDate ?? null,
            complianceFlagged: false,
            complianceFlagReason: null,
            statusHistory: [
                {
                    fromStatus: null,
                    toStatus: "POSTED",
                    changedByUserId: new mongoose.Types.ObjectId(user!.id),
                    changedAt: new Date(),
                    note: "Load created and posted",
                },
            ],
            rateConfirmations: [],
        });

        return NextResponse.json({ success: true, data: newLoad }, { status: 201 });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[loads POST]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
