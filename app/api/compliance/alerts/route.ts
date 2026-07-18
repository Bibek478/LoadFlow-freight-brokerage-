import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { CarrierComplianceRecord } from "@/lib/models/CarrierComplianceRecord";
import { Load } from "@/lib/models/Load";
import { Org } from "@/lib/models/Org";
import { ApiError, humanReadable } from "@/types";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) {
            throw new ApiError(401, "Unauthorized");
        }

        await connectDB();

        const alerts = [];
        const limitDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (user.orgType === "CARRIER") {
            if (user.orgId) {
                const record = await CarrierComplianceRecord.findOne({
                    carrierOrgId: new mongoose.Types.ObjectId(user.orgId),
                }).lean();

                if (record) {
                    const expiryDate = new Date(record.insuranceExpiry);
                    if (expiryDate <= limitDate) {
                        const diffTime = expiryDate.getTime() - Date.now();
                        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        alerts.push({
                            type: "insurance_expiry",
                            daysRemaining,
                            expiryDate,
                        });
                    }
                }
            }
        } else if (user.orgType === "BROKER") {
            if (user.orgId) {
                // Find all active loads for broker having assigned carrier
                const activeLoads = await Load.find({
                    brokerOrgId: new mongoose.Types.ObjectId(user.orgId),
                    status: { $ne: "INVOICED_CLOSED" },
                    carrierOrgId: { $ne: null },
                }).select("carrierOrgId").lean();

                const carrierOrgIds = Array.from(
                    new Set(activeLoads.map((l) => l.carrierOrgId!.toString()))
                ).map((id) => new mongoose.Types.ObjectId(id));

                if (carrierOrgIds.length > 0) {
                    // Find compliance records that are expiring or expired
                    const expiringRecords = await CarrierComplianceRecord.find({
                        carrierOrgId: { $in: carrierOrgIds },
                        insuranceExpiry: { $lte: limitDate },
                    }).lean();

                    if (expiringRecords.length > 0) {
                        const expiringOrgIds = expiringRecords.map((r) => r.carrierOrgId);
                        const orgs = await Org.find({ _id: { $in: expiringOrgIds } }).select("name").lean();
                        const orgMap = new Map(orgs.map((o) => [o._id.toString(), o.name]));

                        for (const record of expiringRecords) {
                            const expiryDate = new Date(record.insuranceExpiry);
                            const diffTime = expiryDate.getTime() - Date.now();
                            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            alerts.push({
                                type: "insurance_expiry_carrier",
                                carrierName: orgMap.get(record.carrierOrgId.toString()) || "Unknown Carrier",
                                carrierOrgId: record.carrierOrgId.toString(),
                                daysRemaining,
                                expiryDate,
                            });
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, data: alerts });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[compliance/alerts GET]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
