import Link from "next/link";
import { Radar, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";

/** Split-screen auth shell — brand story on the left, form on the right (docs/13). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand / value panel */}
      <div className="aurora-bg relative hidden flex-col justify-between overflow-hidden bg-canvas p-12 lg:flex">
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
            <Radar className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Lead Gen Engine</span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-gradient">
            Find businesses that need you — before your competitors do.
          </h2>
          <p className="text-base text-muted-foreground">
            AI discovers companies with broken, slow, or outdated websites, audits them automatically, and
            hands you a ranked pipeline with the exact pitch to open the conversation.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              { icon: Sparkles, text: "AI discovery across thousands of public sources" },
              { icon: ShieldCheck, text: "Automated website, UX & app quality audits" },
              { icon: TrendingUp, text: "Explainable 0–100 opportunity scoring" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-foreground/90">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-muted-foreground">
          <span>Trusted by agencies & sales teams</span>
          <span className="tabular-nums">140+ live opportunities in your workspace</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Radar className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold">Lead Gen Engine</span>
          </div>
          {children}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="#" className="underline hover:text-foreground">Terms</Link> &{" "}
            <Link href="#" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
