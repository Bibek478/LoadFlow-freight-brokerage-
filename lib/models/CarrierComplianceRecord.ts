import mongoose, { Schema } from "mongoose";

const CarrierComplianceRecordSchema = new Schema(
    {
        carrierOrgId: { type: Schema.Types.ObjectId, ref: "Org", required: true, unique: true, index: true },
        insuranceExpiry: { type: Date, required: true },
        mcDotStatus: { type: String, enum: ["ACTIVE", "EXPIRED", "SUSPENDED"], required: true },
        approvedEquipmentTypes: { type: [String], required: true },
        approvedCommodityTypes: { type: [String], required: true },
    },
    { timestamps: true }
);

export const CarrierComplianceRecord =
    mongoose.models.CarrierComplianceRecord ??
    mongoose.model("CarrierComplianceRecord", CarrierComplianceRecordSchema);
