import { NextResponse } from "next/server";
import { z } from "zod";
import { login, SESSION_COOKIE } from "@/server/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  demo: z.boolean().optional(),
});

/** Login (docs/14 §2). Verifies credentials, creates a session, sets the cookie. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  try {
    const { user, token } = await login({ email: parsed.data.email, password: parsed.data.password });
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Login failed." }, { status: 401 });
  }
}
