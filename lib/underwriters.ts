// Active underwriters — source for the tracker's Underwriter filter and the
// detail page's "Assigned to" dropdown. Editable later via the admin page.
import { createClient } from "@/lib/supabase/server";

export async function listUnderwriters(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("underwriters")
    .select("name")
    .eq("active", true)
    .order("name");
  return (data ?? []).map((r) => (r as { name: string }).name);
}
