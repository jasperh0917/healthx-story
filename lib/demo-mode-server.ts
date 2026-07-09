// Server-only demo-mode reader. Kept separate from lib/demo-mode.ts (which is
// pure) so the client toggle can import DEMO_COOKIE without pulling next/headers.
import { cookies } from "next/headers";
import { DEMO_COOKIE } from "@/lib/demo-mode";

export async function isDemoMode(): Promise<boolean> {
  const store = await cookies();
  return store.get(DEMO_COOKIE)?.value === "1";
}
