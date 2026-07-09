"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function setBrokerDisplay(raw: string, name: string) {
  const u = await getCurrentUser();
  if (u?.role !== "head") throw new Error("Only the department head can edit brokers.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("jasper_set_broker_display", { p_raw: raw, p_name: name });
  if (error) throw new Error(error.message);
  revalidatePath("/renewals/brokers");
  revalidatePath("/renewals");
}
