import mongoose, { Schema } from "mongoose";

const OrgSchema = new Schema(
    {
        type: { type: String, enum: ["BROKER", "CARRIER"], required: true },
        name: { type: String, required: true },
    },
    { timestamps: true }
);

export const Org = mongoose.models.Org ?? mongoose.model("Org", OrgSchema);
