import React from "react";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import LoadForm from "@/components/loads/LoadForm";
import { hasPermission } from "@/lib/rbac";

export default async function LoadsPage() {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    // Only Broker staff/admins allowed on /loads page
    if (user.orgType !== "BROKER") {
        redirect("/dashboard");
    }

    const canCreate = hasPermission(user, "load.create");

    await connectDB();

    // Fetch all shippers to populate carrier dropdown option matching orgType == 'SHIPPER'
    const shippersFromDb = (await User.find({ orgType: "SHIPPER" }).sort({ name: 1 }).lean()) as { _id: mongoose.Types.ObjectId; name: string; email: string }[];

    const shippersList = shippersFromDb.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
    }));

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
            {!canCreate ? (
                <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 24,
                    textAlign: "center"
                }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>
                        Load Board
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
                        You do not have permission to post new loads. Contact org admin.
                    </p>
                </div>
            ) : (
                <LoadForm shippers={shippersList} />
            )}
        </div>
    );
}
