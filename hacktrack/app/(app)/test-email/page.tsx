import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { TestEmailClient } from "@/components/TestEmailClient";

export const dynamic = "force-dynamic";

export default async function TestEmailPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <TestEmailClient userEmail={user.email} />;
}
