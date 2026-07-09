// "Who am I" — the signed-in staff member's identity, role, and team.
// Future Jasper screens read this to enforce the per-team wall:
//   role 'head'      → sees every product line (product_line is null)
//   role 'member'    → sees only their own product_line
import { createClient } from "@/lib/supabase/server";

export type JasperProfile = {
  id: string;
  email: string;
  full_name: string;
  role: "head" | "member";
  product_line: string | null;
  is_active: boolean;
};

/** The signed-in staff member, or null if not signed in / no profile. */
export async function getCurrentUser(): Promise<JasperProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("jasper_users")
    .select("id, email, full_name, role, product_line, is_active")
    .eq("id", user.id)
    .maybeSingle();

  return (data as JasperProfile) ?? null;
}
