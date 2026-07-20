import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { DiscoveryConsole } from "@/features/discovery/discovery-console";

export const metadata: Metadata = { title: "Lead Discovery" };

export default function DiscoveryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Discovery"
        description="Define who you help, choose your sources, and let the engine find, audit, and score matching businesses."
        actions={<Badge variant="accent" className="h-6"><Sparkles className="h-3 w-3" /> AI-powered</Badge>}
      />
      <DiscoveryConsole />
    </div>
  );
}
