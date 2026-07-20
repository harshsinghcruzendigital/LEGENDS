/**
 * Auth service (docs/14 §2). DB-backed sessions when a database is configured;
 * falls back to the mock cookie when it isn't (preserves no-DB runnability).
 * The cookie stores an opaque session id (DB mode) or a base64 user blob (mock).
 */
import "server-only";
import { cookies } from "next/headers";
import { hasDatabase, getPrisma } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/password";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "lg_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export interface AuthContext {
  orgId: string;
  userId: string | null;
  isAuthed: boolean;
}

export const ANON_CONTEXT: AuthContext = { orgId: "org_anon", userId: null, isAuthed: false };

function avatarFor(email: string) {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(email)}`;
}

function slugFromEmail(email: string) {
  return email.split("@")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase() + "-" + Math.random().toString(36).slice(2, 7);
}

/* ── mock helpers (no-DB fallback) ───────────────────────────── */
const DEMO_USER: SessionUser = {
  name: "Alex Rivera",
  email: "alex@brightpixel.agency",
  org: "BrightPixel Agency",
  role: "Owner",
  avatarUrl: avatarFor("alex@brightpixel.agency"),
};
function userFromEmail(email: string, name?: string): SessionUser {
  const handle = email.split("@")[0].replace(/[._-]+/g, " ");
  const display = name?.trim() || handle.replace(/\b\w/g, (c) => c.toUpperCase()) || "New User";
  return { name: display, email, org: "Your Agency", role: "Owner", avatarUrl: avatarFor(email) };
}
const encodeMock = (u: SessionUser) => Buffer.from(JSON.stringify(u), "utf8").toString("base64url");
function decodeMock(raw?: string): SessionUser | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    return p && typeof p.email === "string" ? (p as SessionUser) : null;
  } catch {
    return null;
  }
}

/* ── DB session helpers ──────────────────────────────────────── */
async function createDbSession(userId: string): Promise<string> {
  const session = await getPrisma().session.create({
    data: { userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  return session.id;
}

type MembershipWithOrg = { role: string; org: { id: string; name: string } };
function toSessionUser(user: { name: string; email: string; avatarUrl: string | null }, m: MembershipWithOrg): SessionUser {
  const roleLabel = m.role.charAt(0) + m.role.slice(1).toLowerCase();
  return { name: user.name, email: user.email, org: m.org.name, role: roleLabel, avatarUrl: user.avatarUrl ?? avatarFor(user.email) };
}

/* ── public API ──────────────────────────────────────────────── */

export interface AuthResult {
  user: SessionUser;
  token: string;
}

export async function signup(input: { name: string; email: string; password: string; org?: string }): Promise<AuthResult> {
  if (!hasDatabase) {
    const user = userFromEmail(input.email, input.name);
    if (input.org) user.org = input.org;
    return { user, token: encodeMock(user) };
  }
  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("An account with that email already exists.");

  const created = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: hashPassword(input.password),
      avatarUrl: avatarFor(input.email),
      memberships: {
        create: {
          role: "OWNER",
          org: { create: { name: input.org?.trim() || `${input.name.split(" ")[0]}'s Workspace`, slug: slugFromEmail(input.email) } },
        },
      },
    },
    include: { memberships: { include: { org: true } } },
  });
  const token = await createDbSession(created.id);
  return { user: toSessionUser(created, created.memberships[0]), token };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  if (!hasDatabase) {
    const user = input.email === DEMO_USER.email ? DEMO_USER : userFromEmail(input.email);
    return { user, token: encodeMock(user) };
  }
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { memberships: { include: { org: true } } },
  });
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }
  if (user.memberships.length === 0) throw new Error("Account has no workspace.");
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await createDbSession(user.id);
  return { user: toSessionUser(user, user.memberships[0]), token };
}

export async function logout(token: string | undefined): Promise<void> {
  if (hasDatabase && token) {
    await getPrisma().session.delete({ where: { id: token } }).catch(() => {});
  }
}

/** Resolve auth from a raw cookie token (used by the tRPC HTTP context). */
export async function resolveToken(token: string | undefined): Promise<AuthContext> {
  if (!token) return ANON_CONTEXT;
  if (!hasDatabase) {
    const u = decodeMock(token);
    return u ? { orgId: "org_demo", userId: "mock_user", isAuthed: true } : ANON_CONTEXT;
  }
  const session = await getPrisma().session.findUnique({
    where: { id: token },
    include: { user: { include: { memberships: true } } },
  });
  if (!session || session.expiresAt < new Date() || session.user.memberships.length === 0) return ANON_CONTEXT;
  return { orgId: session.user.memberships[0].orgId, userId: session.userId, isAuthed: true };
}

/** Resolve auth from the request cookies (Server Components / caller). */
export async function getAuthContext(): Promise<AuthContext> {
  const store = await cookies();
  return resolveToken(store.get(SESSION_COOKIE)?.value);
}

/** The current session user for Server Components, or null. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  if (!hasDatabase) return decodeMock(token);

  const session = await getPrisma().session.findUnique({
    where: { id: token },
    include: { user: { include: { memberships: { include: { org: true } } } } },
  });
  if (!session || session.expiresAt < new Date() || session.user.memberships.length === 0) return null;
  return toSessionUser(session.user, session.user.memberships[0]);
}
