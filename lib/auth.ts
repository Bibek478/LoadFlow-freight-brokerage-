import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "@/types";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function hashPassword(pw: string): Promise<string> {
    return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pw, hash);
}

export async function createSession(payload: SessionUser): Promise<void> {
    const token = await new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });
}

export async function destroySession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}

export async function getSessionUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as SessionUser;
    } catch {
        return null;
    }
}
