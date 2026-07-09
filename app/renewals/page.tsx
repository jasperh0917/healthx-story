import Link from "next/link";
import { listRenewals } from "@/lib/renewals";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listUnderwriters } from "@/lib/underwriters";
import TrackerTable from "@/components/TrackerTable";
import HamburgerMenu from "@/components/HamburgerMenu";
import { isDemoMode } from "@/lib/demo-mode-server";

export const dynamic = "force-dynamic";

const raleway = { fontFamily: "Raleway, sans-serif" } as const;

const DEFAULT_UNDERWRITER = "Hishaam";

export default async function RenewalsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string; risk?: string }>;
}) {
  const [rows, user, underwriters, sp, demo] = await Promise.all([
    listRenewals("all"),
    getCurrentUser(),
    listUnderwriters(),
    searchParams,
    isDemoMode(),
  ]);

  const now = new Date();
  // A ?month= pre-filter (e.g. from the dashboard) overrides the default period.
  const currentPeriod =
    sp.month?.trim() || `${now.toLocaleString("en-US", { month: "long" })} ${now.getFullYear()}`;
  // A ?status= pre-filter seeds the status multi-select (comma-separated).
  const initialStatus = sp.status
    ? sp.status.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  // A ?risk= pre-filter (from the dashboard) scopes to one 4-tier risk band.
  const initialRisk = sp.risk?.trim() || undefined;
  // Arriving from the dashboard with any pre-filter: show the whole book, not just
  // the default underwriter's (which is mostly unassigned and would look empty).
  const cameFromDashboard = Boolean(sp.month || sp.status || sp.risk);
  const defaultUnderwriter = cameFromDashboard ? "All" : DEFAULT_UNDERWRITER;

  return (
    <div className="min-h-screen w-full bg-white text-[#0b1220]">
      <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
        <Link href="/" className="text-sm text-[#5b6472] transition-colors hover:text-[#0b1220]">
          Back to Home
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <h1 style={raleway} className="text-3xl font-extrabold tracking-tight">
            Renewal Tracker
          </h1>
          <HamburgerMenu isHead={user?.role === "head"} demoInitial={demo} />
        </div>

        <div className="mt-6">
          <TrackerTable
            rows={rows}
            underwriters={underwriters}
            defaultPeriod={currentPeriod}
            defaultUnderwriter={defaultUnderwriter}
            initialStatus={initialStatus}
            initialRisk={initialRisk}
          />
        </div>
      </div>
    </div>
  );
}
