import mongoose, { Schema } from "mongoose";

const AccessDeniedLogSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
        attemptedPermission: { type: String, required: true },
        route: { type: String, required: true },
    },
    { timestamps: true }
);

export const AccessDeniedLog =
    mongoose.models.AccessDeniedLog ??
    mongoose.model("AccessDeniedLog", AccessDeniedLogSchema);
