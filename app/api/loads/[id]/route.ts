import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Load } from "@/lib/models/Load";
import { getSessionUser } from "@/lib/auth";
import { scopeLoadsWhere } from "@/lib/rbac";
import { ApiError, humanReadable } from "@/types";
import mongoose from "mongoose";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getSessionUser();
        if (!user) {
            throw new ApiError(401, "Unauthorized");
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid load ID");
        }

        await connectDB();

        const filter = {
            _id: new mongoose.Types.ObjectId(id),
            ...scopeLoadsWhere(user),
        };

        const load = await Load.findOne(filter).lean();
        if (!load) {
            throw new ApiError(404, "Load not found");
        }

        return NextResponse.json({ success: true, data: load });
    } catch (error) {
        const status = error instanceof ApiError ? error.status : 500;
        if (!(error instanceof ApiError)) console.error("[loads/id GET]", error);
        return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
    }
}
