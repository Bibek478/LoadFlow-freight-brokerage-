import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { hashPassword, createSession } from "@/lib/auth";
import { ApiError, humanReadable } from "@/types";

const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(req: NextRequest) {
    try {
        const body = schema.parse(await req.json());
        await connectDB();

        const existing = await User.findOne({ email: body.email }).lean();
        if (existing) throw new ApiError(409, "Email already in use");

        const passwordHash = await hashPassword(body.password);

        const user = await User.create({
            orgId: null,
            orgType: "SHIPPER",
            email: body.email,
            passwordHash,
            name: body.name,
            isOrgAdmin: false,
            roleId: null,
        });

        await createSession({
            id: user._id.toString(),
            orgId: null,
            orgType: "SHIPPER",
            isOrgAdmin: false,
            permissions: [],
            name: body.name,
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[signup/shipper]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
