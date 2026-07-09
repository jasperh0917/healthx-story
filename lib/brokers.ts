import { createClient } from "@/lib/supabase/server";

export type Broker = {
  raw_broker: string;
  display: string;
  auto_display: string | null;
  override: string | null;
  policies: number;
};

export async function listBrokers(): Promise<Broker[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jasper_broker_list")
    .select("*")
    .order("display")
    .limit(2000);
  return (data ?? []) as Broker[];
}
