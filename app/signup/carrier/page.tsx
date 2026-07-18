import SignupForm from "@/components/auth/SignupForm";

export default function CarrierSignupPage() {
    return (
        <SignupForm
            orgType="carrier"
            title="Create a Carrier account"
            subtitle="You'll be the admin for your carrier company. Staff can be added after signup."
        />
    );
}
