import type { Metadata } from "next";
import { Workflow } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { WorkflowsList } from "@/features/automation/workflows-list";

export const metadata: Metadata = { title: "Automation" };

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation"
        description="Visual workflows: trigger → condition → action, executed reliably via the queue."
        actions={<Badge variant="accent" className="h-6"><Workflow className="h-3 w-3" /> Workflow engine</Badge>}
      />
      <WorkflowsList />
    </div>
  );
}
