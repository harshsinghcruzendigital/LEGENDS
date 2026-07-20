import { Suspense } from "react";
import type { Metadata } from "next";
import { Radar, Download, Bookmark } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadsTable } from "@/features/leads/leads-table";

export const metadata: Metadata = { title: "Lead Database" };

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Database"
        description="Every discovered, audited, and scored opportunity — searchable and filterable."
        actions={
          <>
            <Button variant="outline" size="sm"><Bookmark className="h-4 w-4" /> Saved views</Button>
            <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Export</Button>
            <Button size="sm"><Radar className="h-4 w-4" /> New Discovery</Button>
          </>
        }
      />
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
        <LeadsTable />
      </Suspense>
    </div>
  );
}
