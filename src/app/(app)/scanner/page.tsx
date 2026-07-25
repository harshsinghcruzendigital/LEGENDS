import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { ScannerView } from "@/features/scanner/scanner-view";

export const metadata: Metadata = { title: "Website Scanner" };

export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Scanner"
        description="Audit any real website — SSL, security, SEO, mobile & performance — and save it as a scored lead."
        actions={<Badge variant="success" className="h-6"><Sparkles className="h-3 w-3" /> Real data</Badge>}
      />
      <ScannerView />
    </div>
  );
}
