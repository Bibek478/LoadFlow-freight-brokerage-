import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Org } from "@/lib/models/Org";
import { User } from "@/lib/models/User";
import { hashPassword, createSession } from "@/lib/auth";
import { ApiError, humanReadable } from "@/types";
import mongoose from "mongoose";

const schema = z.object({
    orgName: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ orgType: string }> }
) {
    try {
        const { orgType } = await params;

        if (!["broker", "carrier"].includes(orgType)) {
            throw new ApiError(400, "Invalid org type");
        }

        const body = schema.parse(await req.json());
        await connectDB();

        // Check email uniqueness before transaction
        const existing = await User.findOne({ email: body.email }).lean();
        if (existing) throw new ApiError(409, "Email already in use");

        const resolvedOrgType = orgType.toUpperCase() as "BROKER" | "CARRIER";
        const passwordHash = await hashPassword(body.password);

        let createdUser: InstanceType<typeof User> | null = null;

        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const [org] = await Org.create(
                [{ type: resolvedOrgType, name: body.orgName }],
                { session }
            );
            const [user] = await User.create(
                [
                    {
                        orgId: org._id,
                        orgType: resolvedOrgType,
                        email: body.email,
                        passwordHash,
                        name: body.name,
                        isOrgAdmin: true,
                        roleId: null,
                    },
                ],
                { session }
            );
            createdUser = user;
        });
        session.endSession();

        if (!createdUser) throw new ApiError(500, "Failed to create account");

        const u = createdUser as InstanceType<typeof User> & {
            _id: mongoose.Types.ObjectId;
            orgId: mongoose.Types.ObjectId;
        };

        await createSession({
            id: u._id.toString(),
            orgId: u.orgId.toString(),
            orgType: resolvedOrgType,
            isOrgAdmin: true,
            permissions: [],
            name: body.name,
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[signup/orgType]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
