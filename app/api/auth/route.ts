import { NextResponse } from "next/server";

async function gateHash(secret: string) {
  const data = new TextEncoder().encode(`hx-gate:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.json({ ok: true }); // gate disabled

  const body = await req.json().catch(() => ({}));
  if (typeof body.password !== "string" || body.password !== password) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("hx_gate", await gateHash(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
