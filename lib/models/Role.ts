import mongoose, { Schema } from "mongoose";

const RoleSchema = new Schema(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
        orgType: { type: String, enum: ["BROKER", "CARRIER"], required: true },
        name: { type: String, required: true },
        permissions: { type: [String], required: true },
    },
    { timestamps: true }
);

export const Role = mongoose.models.Role ?? mongoose.model("Role", RoleSchema);
