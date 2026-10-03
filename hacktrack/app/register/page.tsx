import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthHeader, AuthShell } from "@/components/auth/AuthHeader";

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthHeader subtitle="Create your account" />
      <RegisterForm />
    </AuthShell>
  );
}
