import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";

/** Root → send authenticated users to the dashboard, others to login. */
export default async function RootPage() {
  const session = await getSession();
  redirect(session ? "/dashboard" : "/login");
}
