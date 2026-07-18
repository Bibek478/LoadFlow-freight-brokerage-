import React from "react";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Load } from "@/lib/models/Load";
import { Org } from "@/lib/models/Org";
import { User } from "@/lib/models/User";
import mongoose from "mongoose";
import Link from 'next/link';

// Component imports
import ComplianceOverrideBanner from "@/components/loads/ComplianceOverrideBanner";
import LoadStatusActions from "@/components/loads/LoadStatusActions";
import CarrierAssignmentPanel from "@/components/loads/CarrierAssignmentPanel";
import RateConfirmationPanel from "@/components/loads/RateConfirmationPanel";

interface StatusBadgeProps {
    status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
    let background = "var(--color-surface-secondary)";
    let color = "var(--color-text-secondary)";

    switch (status) {
        case "POSTED":
            background = "rgba(152, 161, 172, 0.15)";
            color = "var(--color-text-secondary)";
            break;
        case "CARRIER_ASSIGNED":
        case "RATE_CONFIRMED":
            background = "var(--color-warning-light)";
            color = "var(--color-warning)";
            break;
        case "DISPATCHED":
        case "IN_TRANSIT":
            background = "var(--color-accent-light)";
            color = "var(--color-accent)";
            break;
        case "DELIVERED":
        case "POD_VERIFIED":
            background = "var(--color-success-light)";
            color = "var(--color-success)";
            break;
        case "INVOICED_CLOSED":
            background = "var(--color-text-primary)";
            color = "var(--color-surface)";
            break;
    }

    return (
        <span style={{
            background,
            color,
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em"
        }}>
            {status.replace("_", " ")}
        </span>
    );
}

export default async function LoadDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) redirect("/login");

    if (!mongoose.Types.ObjectId.isValid(id)) {
        redirect("/dashboard");
    }

    await connectDB();

    interface DBStatusHistory {
        fromStatus: string | null;
        toStatus: string;
        changedByUserId: mongoose.Types.ObjectId;
        changedAt: Date;
        note: string | null;
    }

    interface DBAccessorial {
        description: string;
        amount: number;
    }

    interface DBRateConfirmation {
        version: number;
        baseRate: number;
        accessorials: DBAccessorial[];
        totalRate: number;
        confirmedByUserId: mongoose.Types.ObjectId;
        confirmedAt: Date;
        isCurrent: boolean;
    }

    interface DBLoad {
        _id: mongoose.Types.ObjectId;
        brokerOrgId: mongoose.Types.ObjectId;
        shipperId: mongoose.Types.ObjectId;
        carrierOrgId: mongoose.Types.ObjectId | null;
        status: string;
        origin: string;
        destination: string;
        commodityType: string;
        equipmentType: string;
        pickupDate: Date;
        deliveryDate: Date | null;
        complianceFlagged: boolean;
        complianceFlagReason: string | null;
        podUrl: string | null;
        statusHistory?: DBStatusHistory[];
        rateConfirmations?: DBRateConfirmation[];
    }

    const load = (await Load.findById(id).lean()) as unknown as DBLoad | null;
    if (!load) {
        redirect("/dashboard");
    }

    // RBAC scoping check
    const isBroker = user.orgType === "BROKER" && load.brokerOrgId.toString() === user.orgId;
    const isCarrier = user.orgType === "CARRIER" && load.carrierOrgId && load.carrierOrgId.toString() === user.orgId;
    const isShipper = user.orgType === "SHIPPER" && load.shipperId.toString() === user.id;

    if (!isBroker && !isCarrier && !isShipper) {
        redirect("/dashboard");
    }

    // Hydrate associations
    const shipper = (await User.findById(load.shipperId).select("name email").lean()) as { name: string; email: string } | null;
    const brokerOrg = (await Org.findById(load.brokerOrgId).select("name").lean()) as { name: string } | null;
    const carrierOrg = load.carrierOrgId ? ((await Org.findById(load.carrierOrgId).select("name").lean()) as { name: string } | null) : null;

    // Hydrate audit trail user names
    const contributorIds = load.statusHistory?.map((h) => h.changedByUserId) || [];
    const users = (await User.find({ _id: { $in: contributorIds } }).select("name email").lean()) as { _id: mongoose.Types.ObjectId; name: string; email: string }[];
    const userMap: Record<string, { name: string; email: string }> = {};
    users.forEach((u) => {
        userMap[u._id.toString()] = { name: u.name, email: u.email };
    });

    // If broker, fetch carrier list for assignment panel
    let carrierOrgsList: { id: string; name: string }[] = [];
    if (user.orgType === "BROKER") {
        const list = (await Org.find({ type: "CARRIER" }).select("name").sort({ name: 1 }).lean()) as { _id: mongoose.Types.ObjectId; name: string }[];
        carrierOrgsList = list.map((c) => ({
            id: c._id.toString(),
            name: c.name,
        }));
    }

    interface FormattedHistoryItem {
        fromStatus: string | null;
        toStatus: string;
        changedAt: string;
        note: string | null;
        userName: string;
        userEmail: string;
    }

    // Format audit history
    const formattedHistory: FormattedHistoryItem[] = (load.statusHistory || []).map((h) => {
        const u = userMap[h.changedByUserId.toString()];
        return {
            fromStatus: h.fromStatus,
            toStatus: h.toStatus,
            changedAt: h.changedAt ? new Date(h.changedAt).toLocaleString() : "",
            note: h.note,
            userName: u ? u.name : "System / Unknown",
            userEmail: u ? u.email : ""
        };
    }).sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

    // Adapt rate confirmations formats
    const rateConfirmationsData = (load.rateConfirmations || []).map((r) => ({
        version: r.version,
        baseRate: r.baseRate,
        accessorials: r.accessorials || [],
        totalRate: r.totalRate,
        confirmedByUserId: r.confirmedByUserId.toString(),
        confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : "",
        isCurrent: r.isCurrent,
    }));

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
            {/* Top Breadcrumb Nav */}
            <div style={{ marginBottom: 20 }}>
                <Link href={user.orgType === "BROKER" ? "/loads" : "/dashboard"} style={{
                    color: "var(--color-accent)",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none"
                }}>
                    &larr; Back to {user.orgType === "BROKER" ? "Load Board" : "Dashboard"}
                </Link>
            </div>

            {/* Compliance Banner */}
            <ComplianceOverrideBanner
                loadId={load._id.toString()}
                complianceFlagged={!!load.complianceFlagged}
                complianceFlagReason={load.complianceFlagReason || null}
                userOrgType={user.orgType}
                isOrgAdmin={user.isOrgAdmin}
                userPermissions={user.permissions}
            />

            {/* Detail Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>

                {/* Main Content Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                    {/* Header Detail Card */}
                    <div style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        padding: 24
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div>
                                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Load Reference</span>
                                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0" }}>
                                    #{load._id.toString().substring(0, 8).toUpperCase()}
                                </h1>
                            </div>
                            <StatusBadge status={load.status} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 12 }}>
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Origin</span>
                                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", marginTop: 4 }}>
                                    📍 {load.origin}
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Destination</span>
                                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", marginTop: 4 }}>
                                    🏁 {load.destination}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
                            <div>
                                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Equipment</span>
                                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginTop: 2 }}>
                                    {load.equipmentType}
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Commodity</span>
                                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginTop: 2 }}>
                                    {load.commodityType}
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Pickup Date</span>
                                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginTop: 2 }}>
                                    {new Date(load.pickupDate).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Associated Parties */}
                    <div style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        padding: 24
                    }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 16 }}>
                            Parties Involved
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                <span style={{ color: "var(--color-text-secondary)" }}>Managing Brokerage:</span>
                                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{brokerOrg?.name || "System Brokerage"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                <span style={{ color: "var(--color-text-secondary)" }}>Client Shipper:</span>
                                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{shipper ? `${shipper.name} (${shipper.email})` : "Private Shipper"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, alignItems: "center" }}>
                                <span style={{ color: "var(--color-text-secondary)" }}>Assigned Carrier:</span>
                                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                                    {carrierOrg ? carrierOrg.name : "Unassigned"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Audit Trail List */}
                    <div style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        padding: 24
                    }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 16 }}>
                            Activity Audit Trail ({formattedHistory.length})
                        </h2>

                        {formattedHistory.length === 0 ? (
                            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                                No history logs recorded yet.
                            </p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {formattedHistory.map((item: FormattedHistoryItem, idx: number) => (
                                    <div key={idx} style={{
                                        borderBottom: idx === formattedHistory.length - 1 ? "none" : "1px solid var(--color-surface-secondary)",
                                        paddingBottom: idx === formattedHistory.length - 1 ? 0 : 12
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                            <span style={{ color: "var(--color-text-primary)" }}>
                                                <strong>{item.userName}</strong> changed status:
                                                <span style={{ color: "var(--color-text-secondary)", marginLeft: 6 }}>
                                                    {item.fromStatus} &rarr; {item.toStatus}
                                                </span>
                                            </span>
                                            <span style={{ color: "var(--color-text-muted)" }}>{item.changedAt}</span>
                                        </div>
                                        {item.note && (
                                            <p style={{
                                                fontSize: 12,
                                                color: "var(--color-text-secondary)",
                                                margin: "4px 0 0 0",
                                                background: "var(--color-surface-secondary)",
                                                padding: "6px 10px",
                                                borderRadius: "var(--radius-sm)",
                                                display: "inline-block"
                                            }}>
                                                Note: {item.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column Control Panels */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Carrier Assignment Panel */}
                    <CarrierAssignmentPanel
                        loadId={load._id.toString()}
                        currentStatus={load.status}
                        carriers={carrierOrgsList}
                        userOrgType={user.orgType}
                        isOrgAdmin={user.isOrgAdmin}
                        userPermissions={user.permissions}
                    />

                    {/* Rate Confirmation Panel */}
                    <RateConfirmationPanel
                        loadId={load._id.toString()}
                        currentStatus={load.status}
                        carrierOrgId={load.carrierOrgId ? load.carrierOrgId.toString() : null}
                        rateConfirmations={rateConfirmationsData}
                        userOrgType={user.orgType}
                        isOrgAdmin={user.isOrgAdmin}
                        userPermissions={user.permissions}
                    />

                    {/* Status Action controls */}
                    <div style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        padding: 20
                    }}>
                        <LoadStatusActions
                            loadId={load._id.toString()}
                            currentStatus={load.status}
                            carrierOrgId={load.carrierOrgId ? load.carrierOrgId.toString() : null}
                            brokerOrgId={load.brokerOrgId.toString()}
                            userOrgType={user.orgType}
                            userOrgId={user.orgId}
                            isOrgAdmin={user.isOrgAdmin}
                            userPermissions={user.permissions}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
