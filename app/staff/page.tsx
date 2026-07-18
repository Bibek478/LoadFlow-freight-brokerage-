import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StaffPageClient from "@/components/staff/StaffPageClient";

export default async function StaffPage() {
    const user = await getSessionUser();
    if (!user) redirect("/login");
    // Admin-only — server-side check, not just UI hide
    if (!user.isOrgAdmin || user.orgType === "SHIPPER") redirect("/dashboard");

    return <StaffPageClient user={user} />;
}
