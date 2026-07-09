// Policy-grouping data for the Manage Policies screen. Reads each raw TRR policy
// and the master group it rolls into, plus each master's display name.
import { createClient } from "@/lib/supabase/server";

export type GroupMember = {
  client: string;
  master_group: string;
  auto_master: string;
  is_overridden: boolean;
  clean_name: string;
  expiry_date: string | null;
  net_premium: number | null;
  gross_premium: number | null;
  nlr_net: number | null;
  broker: string | null;
  product_line: string | null;
};

export type PolicyGroup = {
  master_key: string;
  renewal_id: string | null;
  display: string; // cleaned / overridden display name
  display_override: string | null;
  product_line: string | null;
  sub_policies: number;
  total_net: number;
  blended_nlr: number | null;
  is_overridden: boolean;
  members: GroupMember[];
};

export async function listGroups(): Promise<PolicyGroup[]> {
  const supabase = await createClient();
  const [{ data: memData }, { data: trkData }] = await Promise.all([
    supabase.from("jasper_group_members").select("*").limit(2000),
    supabase.from("jasper_tracker").select("id,master_key,group_display,display_override").limit(2000),
  ]);
  const members = (memData ?? []) as GroupMember[];
  const trk = new Map<string, { id: string; group_display: string; display_override: string | null }>();
  for (const t of (trkData ?? []) as Array<{ id: string; master_key: string; group_display: string; display_override: string | null }>) {
    trk.set(t.master_key, { id: t.id, group_display: t.group_display, display_override: t.display_override });
  }

  const byGroup = new Map<string, GroupMember[]>();
  for (const m of members) {
    const arr = byGroup.get(m.master_group) ?? [];
    arr.push(m);
    byGroup.set(m.master_group, arr);
  }

  const groups: PolicyGroup[] = [];
  for (const [key, ms] of byGroup) {
    ms.sort((a, b) => (b.net_premium ?? 0) - (a.net_premium ?? 0));
    const rep = ms[0];
    let totNet = 0, wNlr = 0, wDen = 0, overridden = false;
    for (const m of ms) {
      const np = m.net_premium ?? 0;
      totNet += np;
      if (m.nlr_net != null) { wNlr += m.nlr_net * np; wDen += np; }
      if (m.is_overridden) overridden = true;
    }
    const t = trk.get(key);
    groups.push({
      master_key: key,
      renewal_id: t?.id ?? null,
      display: t?.group_display ?? rep?.clean_name ?? key,
      display_override: t?.display_override ?? null,
      product_line: rep?.product_line ?? null,
      sub_policies: ms.length,
      total_net: totNet,
      blended_nlr: wDen > 0 ? wNlr / wDen : (rep?.nlr_net ?? null),
      is_overridden: overridden,
      members: ms,
    });
  }
  groups.sort((a, b) => a.display.localeCompare(b.display));
  return groups;
}
