import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guard (docs/14 §1 — the app-layer half of tenancy/auth).
 * M1: presence of the mock session cookie gates the /app area. Real RBAC/RLS
 * arrives with the API milestone; the guard shape stays the same.
 */
const SESSION_COOKIE = "lg_session";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot"];
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/discovery",
  "/leads",
  "/campaigns",
  "/crm",
  "/automation",
  "/insights",
  "/settings",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isPublicAuth = PUBLIC_PATHS.some((p) => pathname === p);

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublicAuth && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/discovery/:path*",
    "/leads/:path*",
    "/campaigns/:path*",
    "/crm/:path*",
    "/automation/:path*",
    "/insights/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot",
  ],
};
