import SignupForm from "@/components/auth/SignupForm";

export default function ShipperSignupPage() {
    return (
        <SignupForm
            orgType="shipper"
            title="Create a Shipper account"
            subtitle="Track your shipments from pickup to delivery."
        />
    );
}
