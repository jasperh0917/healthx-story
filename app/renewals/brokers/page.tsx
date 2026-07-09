import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listBrokers } from "@/lib/brokers";
import BrokerManager from "@/components/BrokerManager";

export const dynamic = "force-dynamic";

const raleway = { fontFamily: "Raleway, sans-serif" } as const;

export default async function BrokersPage() {
  const user = await getCurrentUser();

  if (user?.role !== "head") {
    return (
      <div className="min-h-screen w-full bg-white text-[#0b1220]">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
          <Link href="/renewals" className="text-sm text-[#5b6472] hover:text-[#0b1220]">
            ← Renewal Tracker
          </Link>
          <h1 style={raleway} className="mt-8 text-2xl font-extrabold">Manage Brokers</h1>
          <p className="mt-3 text-sm text-[#5b6472]">Only the department head can manage broker names.</p>
        </div>
      </div>
    );
  }

  const brokers = await listBrokers();

  return (
    <div className="min-h-screen w-full bg-white text-[#0b1220]">
      <div className="mx-auto max-w-[1000px] px-6 py-10 sm:px-10">
        <Link href="/renewals" className="text-sm text-[#5b6472] transition-colors hover:text-[#0b1220]">
          ← Renewal Tracker
        </Link>
        <h1 style={raleway} className="mt-8 text-3xl font-extrabold tracking-tight">Manage Brokers</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5b6472]">
          Jasper cleans broker names automatically — Proper Case, corporate suffixes and
          &quot;Insurance Brokers&quot; stripped. Edit any display name (click and type); it flows
          straight to the tracker. <strong>Reset</strong> returns a name to the automatic version.
        </p>
        <BrokerManager brokers={brokers} />
      </div>
    </div>
  );
}
