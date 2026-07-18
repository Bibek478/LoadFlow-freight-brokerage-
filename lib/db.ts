/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";

const cached = (global as any).mongoose ?? { conn: null, promise: null };
(global as any).mongoose = cached;

export async function connectDB() {
    if (cached.conn) return cached.conn;

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable is missing.");
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
