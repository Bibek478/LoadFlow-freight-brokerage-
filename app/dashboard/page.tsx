import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BrokerDashboard from "@/components/dashboard/BrokerDashboard";
import CarrierDashboard from "@/components/dashboard/CarrierDashboard";

export default async function DashboardPage() {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
                Dashboard
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24 }}>
                Welcome back, {user.name}
                {user.orgType !== "SHIPPER" && user.isOrgAdmin ? " (Admin)" : ""}
            </p>

            {user.orgType === "BROKER" && <BrokerDashboard user={user} />}
            {user.orgType === "CARRIER" && <CarrierDashboard user={user} />}
            {user.orgType === "SHIPPER" && (
                <div
                    style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        padding: 20,
                    }}
                >
                    <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                        Your shipment status will appear here. Phase 2 coming next.
                    </p>
                </div>
            )}
        </div>
    );
}
