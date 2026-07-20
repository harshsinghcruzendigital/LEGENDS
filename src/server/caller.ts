/**
 * Server-side tRPC caller (docs/06 §6) — Server Components call routers directly,
 * no HTTP round-trip. Context is the real resolved auth from the session cookie.
 */
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/root";
import { getAuthContext } from "@/server/auth";

const createCaller = createCallerFactory(appRouter);

export async function getServerCaller() {
  const ctx = await getAuthContext();
  return createCaller(ctx);
}
