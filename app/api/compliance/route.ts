import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { CarrierComplianceRecord } from "@/lib/models/CarrierComplianceRecord";
import { getSessionUser } from "@/lib/auth";
import { ApiError, humanReadable } from "@/types";
import { scopeComplianceWhere } from "@/lib/rbac";

const complianceSchema = z.object({
    insuranceExpiry: z.preprocess((val) => (typeof val === "string" ? new Date(val) : val), z.date()),
    mcDotStatus: z.enum(["ACTIVE", "EXPIRED", "SUSPENDED"]),
    approvedEquipmentTypes: z.array(z.string()),
    approvedCommodityTypes: z.array(z.string()),
});

export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user || user.orgType !== "CARRIER" || !user.orgId) {
            throw new ApiError(403, "Only carrier staff can access compliance records");
        }

        await connectDB();

        const record = await CarrierComplianceRecord.findOne(scopeComplianceWhere(user)).lean();
        if (!record) {
            return NextResponse.json({ success: true, data: null });
        }

        return NextResponse.json({ success: true, data: record });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[compliance GET]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user || user.orgType !== "CARRIER" || !user.orgId) {
            throw new ApiError(403, "Only carrier staff can modify compliance records");
        }

        const body = complianceSchema.parse(await req.json());
        await connectDB();

        const record = await CarrierComplianceRecord.findOneAndUpdate(
            scopeComplianceWhere(user),
            {
                $set: {
                    insuranceExpiry: body.insuranceExpiry,
                    mcDotStatus: body.mcDotStatus,
                    approvedEquipmentTypes: body.approvedEquipmentTypes,
                    approvedCommodityTypes: body.approvedCommodityTypes,
                },
            },
            { new: true, upsert: true }
        ).lean();

        return NextResponse.json({ success: true, data: record });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[compliance PUT]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
