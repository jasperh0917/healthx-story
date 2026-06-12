import { NextRequest, NextResponse } from "next/server";

// Site-wide access gate. Set SITE_PASSWORD in the environment to enable;
// when unset (e.g. local dev) the gate is disabled.
const PUBLIC_PATHS = ["/login", "/api/auth"];

async function gateHash(secret: string) {
  const data = new TextEncoder().encode(`hx-gate:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookie = req.cookies.get("hx_gate")?.value;
  if (cookie && cookie === (await gateHash(password))) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Gate everything except Next internals and static assets (the login page needs the logo)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|ico|webp)).*)"],
};
