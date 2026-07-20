/**
 * Client-safe auth constant. The real auth service (sessions, hashing, signup/login)
 * lives in `src/server/auth.ts` (server-only). Middleware reads this cookie name.
 */
export const SESSION_COOKIE = "lg_session";
