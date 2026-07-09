import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Jasper is walled behind sign-in. Every request refreshes the Supabase session
// and, if you're not signed in, bounces you to /login. (Replaces the old
// single-shared-password gate.)
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Guard everything except Next internals and static assets (login needs the logo).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|ico|webp)).*)",
  ],
};
