import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/root";
import { createContext } from "@/server/trpc";

// Allow slow procedures (PageSpeed/Lighthouse enrichment ~20-30s). Vercel clamps
// this to the plan's max; fast calls still return immediately.
export const maxDuration = 60;

/** tRPC HTTP handler (docs/08 — base at /api/trpc). */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
  });

export { handler as GET, handler as POST };
