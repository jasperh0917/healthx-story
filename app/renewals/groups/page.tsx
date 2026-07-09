import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listGroups } from "@/lib/groups";
import GroupManager from "@/components/GroupManager";

export const dynamic = "force-dynamic";

const raleway = { fontFamily: "Raleway, sans-serif" } as const;

export default async function GroupsPage() {
  const user = await getCurrentUser();

  if (user?.role !== "head") {
    return (
      <div className="min-h-screen w-full bg-white text-[#0b1220]">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
          <Link href="/renewals" className="text-sm text-[#5b6472] hover:text-[#0b1220]">
            ← Renewal tracker
          </Link>
          <h1 style={raleway} className="mt-8 text-2xl font-extrabold">
            Manage Policies
          </h1>
          <p className="mt-3 text-sm text-[#5b6472]">
            Only the department head can manage how policies are grouped into master contracts.
          </p>
        </div>
      </div>
    );
  }

  const groups = await listGroups();

  return (
    <div className="min-h-screen w-full bg-white text-[#0b1220]">
      <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
        <Link href="/renewals" className="text-sm text-[#5b6472] transition-colors hover:text-[#0b1220]">
          ← Renewal tracker
        </Link>
        <h1 style={raleway} className="mt-8 text-3xl font-extrabold tracking-tight">
          Policy groups
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5b6472]">
          Jasper auto-groups sub-policies into master contracts and cleans up their names. You decide
          the final word: <strong>edit a display name</strong> (click it and type), tick policies and{" "}
          <strong>Combine</strong> them, <strong>Split</strong> one out, or <strong>Revert</strong> to
          the automatic grouping. Your decisions drive the tracker.
        </p>
        <GroupManager groups={groups} />
      </div>
    </div>
  );
}
