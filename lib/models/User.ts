import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Org", default: null },
        orgType: { type: String, enum: ["BROKER", "CARRIER", "SHIPPER"], required: true },
        email: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, required: true },
        name: { type: String, required: true },
        isOrgAdmin: { type: Boolean, required: true },
        roleId: { type: Schema.Types.ObjectId, ref: "Role", default: null },
    },
    { timestamps: true }
);

UserSchema.index({ orgId: 1 });

export const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
