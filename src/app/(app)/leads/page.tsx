import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadsTable } from "@/features/leads/leads-table";

export const metadata: Metadata = { title: "Lead Database" };

export default function LeadsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
      <LeadsTable />
    </Suspense>
  );
}
