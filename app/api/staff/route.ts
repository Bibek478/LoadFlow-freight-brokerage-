import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Role } from "@/lib/models/Role";
import { getSessionUser } from "@/lib/auth";
import { requirePermission, scopeStaffWhere } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth";
import { ApiError, humanReadable } from "@/types";
import mongoose from "mongoose";

const createSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    roleId: z.string().min(1),
});

export async function GET() {
    try {
        const user = await getSessionUser();
        await requirePermission(user, "staff.manage", "/api/staff");
        await connectDB();

        const staff = await User.find({
            ...scopeStaffWhere(user!),
            isOrgAdmin: false,
        })
            .select("-passwordHash")
            .lean();

        // Attach role names
        const roleIds = staff
            .map((s) => s.roleId)
            .filter(Boolean) as mongoose.Types.ObjectId[];
        const roles = await Role.find({ _id: { $in: roleIds } }).lean();
        const roleMap = new Map(roles.map((r) => [r._id.toString(), r.name]));

        const enriched = staff.map((s) => ({
            ...s,
            roleName: s.roleId ? (roleMap.get(s.roleId.toString()) ?? "Unknown") : null,
        }));

        return NextResponse.json({ success: true, data: enriched });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[staff GET]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser();
        await requirePermission(user, "staff.manage", "/api/staff");

        const body = createSchema.parse(await req.json());
        await connectDB();

        // Verify role belongs to the same org
        const role = await Role.findById(body.roleId).lean();
        if (!role || role.orgId.toString() !== user!.orgId) {
            throw new ApiError(400, "Invalid role");
        }

        const existing = await User.findOne({ email: body.email }).lean();
        if (existing) throw new ApiError(409, "Email already in use");

        const passwordHash = await hashPassword(body.password);

        const staffUser = await User.create({
            orgId: user!.orgId,
            orgType: user!.orgType,
            email: body.email,
            passwordHash,
            name: body.name,
            isOrgAdmin: false,
            roleId: new mongoose.Types.ObjectId(body.roleId),
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: staffUser._id,
                    name: staffUser.name,
                    email: staffUser.email,
                    tempPassword: body.password, // shown once
                },
            },
            { status: 201 }
        );
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[staff POST]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
