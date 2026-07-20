/**
 * tRPC initialization (docs/08 §1-2, docs/14 auth). Context carries the resolved
 * auth (orgId + userId + isAuthed) from the session cookie. `protectedProcedure`
 * rejects unauthenticated calls — every data router uses it.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { resolveToken, type AuthContext, SESSION_COOKIE } from "@/server/auth";

export type Context = AuthContext;

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Built per HTTP request from the session cookie. */
export async function createContext(opts: { req: Request }): Promise<Context> {
  const token = readCookie(opts.req.headers.get("cookie"), SESSION_COOKIE);
  return resolveToken(token);
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/** Requires an authenticated session; narrows userId to non-null. */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.isAuthed || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
