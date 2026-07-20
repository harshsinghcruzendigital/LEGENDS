import Link from "next/link";
import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/page-header";

/**
 * Honest, clearly-marked Milestone-2 module preview (implementation rule:
 * placeholders must be explicitly flagged). Renders real chrome + the roadmap
 * for the module so navigation never hits a dead/broken page.
 */
export function ModulePreview({
  icon: Icon,
  title,
  description,
  features,
  docRef,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  features: { title: string; body: string }[];
  docRef: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={<Badge variant="accent" className="h-6"><Sparkles className="h-3 w-3" /> Milestone 2</Badge>}
      />

      <GlassCard className="aurora-bg relative overflow-hidden p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{title} is coming in Milestone 2</h2>
          <p className="mt-2 text-muted-foreground">
            The interface, data model, and API contracts for this module are already fully specified in the
            architecture. This milestone ships the foundation (auth, dashboard, and the Lead Database) first;
            this module is next.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild><Link href="/leads">Explore the Lead Database <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard">Back to dashboard</Link></Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Spec: <code className="rounded bg-secondary px-1.5 py-0.5 font-mono">{docRef}</code></p>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <GlassCard key={f.title} className="p-5">
            <h3 className="text-sm font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
