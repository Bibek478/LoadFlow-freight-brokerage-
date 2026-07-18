import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ComplianceForm from "@/components/compliance/ComplianceForm";

export default async function CompliancePage() {
    const user = await getSessionUser();

    // If not authenticated, redirect to login
    if (!user) {
        redirect("/login");
    }

    // Only Carrier organization member can access compliance record
    if (user.orgType !== "CARRIER") {
        redirect("/dashboard");
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
                Carrier Compliance Settings
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24 }}>
                Maintain MC/DOT safety standing, insurance policy dates, and equipment approvals required for brokerage assignments.
            </p>

            <div
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 20,
                }}
            >
                <ComplianceForm user={user} />
            </div>
        </div>
    );
}
