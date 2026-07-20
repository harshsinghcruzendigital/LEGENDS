import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsView } from "@/features/settings/settings-view";
import { getSession } from "@/server/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, organization, team, and billing." />
      <SettingsView user={session} />
    </div>
  );
}
