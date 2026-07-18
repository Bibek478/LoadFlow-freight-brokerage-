import React from "react";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import mongoose from "mongoose";
import LoadBoard from "@/components/loads/LoadBoard";

export default async function LoadsPage() {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    // Only Broker staff/admins allowed on /loads page
    if (user.orgType !== "BROKER") {
        redirect("/dashboard");
    }

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
            <LoadBoard user={user} shippers={shippersList} />
        </div>
    );
}
