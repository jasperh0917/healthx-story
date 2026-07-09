import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard-data";
import { isDemoMode } from "@/lib/demo-mode-server";
import DashboardCards from "@/components/dashboard/DashboardCards";
import DemoModeToggle from "@/components/DemoModeToggle";

// Date-driven (the pipeline window depends on today), so never cache.
export const dynamic = "force-dynamic";

const raleway = { fontFamily: "Raleway, sans-serif" } as const;

export default async function RenewalDashboardPage() {
  const now = new Date();
  const [data, demo] = await Promise.all([getDashboardData(now), isDemoMode()]);

  const today = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen w-full bg-white text-[#0b1220]">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/renewals" className="text-sm text-[#5b6472] transition-colors hover:text-[#0b1220]">
            Back to Renewal Tracker
          </Link>
          <DemoModeToggle initial={demo} />
        </div>

        <header className="mt-8">
          <h1 style={raleway} className="text-3xl font-extrabold tracking-tight">
            Renewal Dashboard
          </h1>
          <p className="mt-2 text-sm text-[#5b6472]">
            Renewed premium and live pipeline, grouped by risk. As of {today}.
          </p>
        </header>

        <div className="mt-8">
          <DashboardCards data={data} />
        </div>

        {data.live ? (
          <p className="mt-6 text-[11px] text-[#b6bdc9]">
            Live from the renewal tracker and TRR. Grouped by upcoming start month (expiry + 1 day).
          </p>
        ) : (
          <p className="mt-6 text-xs text-[#b0451f]">
            Couldn&apos;t reach the live data just now — figures show zero rather than a guess.
          </p>
        )}
      </div>
    </div>
  );
}
