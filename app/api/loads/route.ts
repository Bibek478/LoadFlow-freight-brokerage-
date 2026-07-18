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

import { Org } from "@/lib/models/Org";

export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) {
            throw new ApiError(401, "Unauthorized");
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const limitStr = searchParams.get("limit");
        const limit = limitStr ? parseInt(limitStr, 10) : undefined;

        await connectDB();

        const filter = scopeLoadsWhere(user);
        let finalFilter: any = { ...filter };

        if (status) {
            finalFilter.status = status;
        }

        if (search) {
            const matchingShippers = await User.find({
                orgType: "SHIPPER",
                name: { $regex: search, $options: "i" }
            }).select("_id").lean();
            const shipperIds = matchingShippers.map(s => s._id);

            const matchingCarriers = await Org.find({
                type: "CARRIER",
                name: { $regex: search, $options: "i" }
            }).select("_id").lean();
            const carrierOrgIds = matchingCarriers.map(c => c._id);

            finalFilter.$or = [
                { origin: { $regex: search, $options: "i" } },
                { destination: { $regex: search, $options: "i" } },
                { shipperId: { $in: shipperIds } },
                { carrierOrgId: { $in: carrierOrgIds } }
            ];
        }

        let query = Load.find(finalFilter).sort({ createdAt: -1 });
        if (limit) {
            query = query.limit(limit);
        }

        const loads = await query.lean();

        // Hydrate shipper and carrier names
        const shipperIds = loads.map(l => l.shipperId).filter(Boolean);
        const carrierOrgIds = loads.map(l => l.carrierOrgId).filter(Boolean);

        const shippers = await User.find({ _id: { $in: shipperIds } }).select("name email").lean();
        const carriers = await Org.find({ _id: { $in: carrierOrgIds } }).select("name").lean();

        const shipperMap = new Map(shippers.map(s => [s._id.toString(), s]));
        const carrierMap = new Map(carriers.map(c => [c._id.toString(), c]));

        const hydratedLoads = loads.map(l => {
            const shipper = shipperMap.get(l.shipperId.toString());
            const carrier = l.carrierOrgId ? carrierMap.get(l.carrierOrgId.toString()) : null;
            return {
                ...l,
                shipperName: shipper?.name || "Unknown Shipper",
                shipperEmail: shipper?.email || "",
                carrierName: carrier?.name || "Unassigned"
            };
        });

        return NextResponse.json({ success: true, data: hydratedLoads });
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
