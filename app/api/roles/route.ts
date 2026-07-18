import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Role } from "@/lib/models/Role";
import { getSessionUser } from "@/lib/auth";
import { requirePermission, scopeRolesWhere } from "@/lib/rbac";
import { ApiError, humanReadable, BROKER_PERMISSIONS, CARRIER_PERMISSIONS } from "@/types";
import type { Permission } from "@/types";

const createSchema = z.object({
    name: z.string().min(1),
    permissions: z.array(z.string()).min(1),
});

export async function GET() {
    try {
        const user = await getSessionUser();
        await requirePermission(user, "staff.manage", "/api/roles");
        await connectDB();

        const roles = await Role.find(scopeRolesWhere(user!)).lean();
        return NextResponse.json({ success: true, data: roles });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[roles GET]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser();
        await requirePermission(user, "staff.manage", "/api/roles");

        const body = createSchema.parse(await req.json());
        await connectDB();

        // Validate permissions against org-type catalog
        const validPerms =
            user!.orgType === "BROKER" ? BROKER_PERMISSIONS : CARRIER_PERMISSIONS;
        const invalid = body.permissions.filter(
            (p) => !validPerms.includes(p as Permission)
        );
        if (invalid.length > 0) {
            throw new ApiError(400, `Invalid permissions: ${invalid.join(", ")}`);
        }

        const role = await Role.create({
            orgId: user!.orgId,
            orgType: user!.orgType,
            name: body.name,
            permissions: body.permissions,
        });

        return NextResponse.json({ success: true, data: role }, { status: 201 });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[roles POST]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
