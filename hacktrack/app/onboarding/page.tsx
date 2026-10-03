import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.needsOnboarding) redirect("/home");

  return <OnboardingWizard name={user.name} profile={user.profile} />;
}
