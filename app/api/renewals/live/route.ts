import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always read live — never cache renewals

// Jasper Step 1 — proof of the live link.
// Reads the renewal spine (public.jasper_renewals_live) straight from TRR, live.
// Every Jasper screen added later reads through views like this one, so the data
// is never typed by hand and never goes stale.
//
//   GET /api/renewals/live            → 25 most recent renewals
//   GET /api/renewals/live?limit=100  → up to 200
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 25), 1), 200);

  try {
    const renewals = await query(
      `select group_name,
              product_line,
              broker,
              underwriting_year,
              expiry_date,
              days_to_expiry,
              lives,
              net_premium,
              live_nlr,          -- incurred NLR (includes outstanding), NOT paid-only
              paid_only_nlr_ref  -- shown only so the paid-vs-incurred gap stays visible
         from jasper_renewals_live
        order by expiry_date desc
        limit $1`,
      [limit],
    );

    return NextResponse.json({ ok: true, count: renewals.length, renewals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "read failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
