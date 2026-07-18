import SignupForm from "@/components/auth/SignupForm";

export default function BrokerSignupPage() {
    return (
        <SignupForm
            orgType="broker"
            title="Create a Broker account"
            subtitle="You'll be the admin for your brokerage. Staff can be added after signup."
        />
    );
}
