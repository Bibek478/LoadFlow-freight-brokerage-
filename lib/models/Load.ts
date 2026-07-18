import mongoose, { Schema } from "mongoose";

const StatusHistorySchema = new Schema(
    {
        fromStatus: { type: String, default: null },
        toStatus: { type: String, required: true },
        changedByUserId: { type: Schema.Types.ObjectId, required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: null },
    },
    { _id: false }
);

const RateConfirmationSchema = new Schema(
    {
        version: { type: Number, required: true },
        baseRate: { type: Number, required: true },
        accessorials: [{ description: String, amount: Number }],
        totalRate: { type: Number, required: true },
        confirmedByUserId: { type: Schema.Types.ObjectId, required: true },
        confirmedAt: { type: Date, default: Date.now },
        isCurrent: { type: Boolean, default: true },
    },
    { _id: false }
);

const LoadSchema = new Schema(
    {
        brokerOrgId: { type: Schema.Types.ObjectId, required: true },
        shipperId: { type: Schema.Types.ObjectId, required: true },
        carrierOrgId: { type: Schema.Types.ObjectId, default: null },
        status: { type: String, required: true, default: "POSTED" },
        origin: { type: String, required: true },
        destination: { type: String, required: true },
        commodityType: { type: String, required: true },
        equipmentType: { type: String, required: true },
        pickupDate: { type: Date, required: true },
        deliveryDate: { type: Date, default: null },
        complianceFlagged: { type: Boolean, default: false },
        complianceFlagReason: { type: String, default: null },
        podUrl: { type: String, default: null },
        statusHistory: [StatusHistorySchema],
        rateConfirmations: [RateConfirmationSchema],
    },
    { timestamps: true }
);

export const Load = mongoose.models.Load ?? mongoose.model("Load", LoadSchema);
