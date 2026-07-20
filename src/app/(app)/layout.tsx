import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { AppShell } from "@/components/shell/app-shell";

/** Authenticated shell layout — resolves the session (docs/14) and mounts the chrome. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AppShell user={session}>{children}</AppShell>;
}
