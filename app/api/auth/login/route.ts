import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Role } from "@/lib/models/Role";
import { verifyPassword, createSession } from "@/lib/auth";
import { ApiError, humanReadable } from "@/types";
import type { Permission } from "@/types";
import mongoose from "mongoose";

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const body = schema.parse(await req.json());
        await connectDB();

        const user = await User.findOne({ email: body.email }).lean();
        if (!user) throw new ApiError(401, "Invalid email or password");

        const ok = await verifyPassword(body.password, user.passwordHash);
        if (!ok) throw new ApiError(401, "Invalid email or password");

        // Resolve permissions from role (if any)
        let permissions: Permission[] = [];
        if (user.roleId) {
            const role = await Role.findById(user.roleId).lean();
            if (role) permissions = role.permissions as Permission[];
        }

        await createSession({
            id: (user._id as mongoose.Types.ObjectId).toString(),
            orgId: user.orgId ? (user.orgId as mongoose.Types.ObjectId).toString() : null,
            orgType: user.orgType as "BROKER" | "CARRIER" | "SHIPPER",
            isOrgAdmin: user.isOrgAdmin,
            permissions,
            name: user.name,
        });

        return NextResponse.json({ success: true, orgType: user.orgType });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[auth/login]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
