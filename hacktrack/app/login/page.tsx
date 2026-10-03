import { LoginForm } from "@/components/auth/LoginForm";
import { AuthHeader, AuthShell } from "@/components/auth/AuthHeader";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell>
      <AuthHeader subtitle="Welcome back" />
      <LoginForm oauthError={error} />
    </AuthShell>
  );
}
