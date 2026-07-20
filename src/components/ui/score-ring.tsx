import { cn } from "@/lib/utils";

/** Score → semantic color (docs/13 §2 score scale). Colorblind-safe: always paired with the number. */
export function scoreColor(score: number): string {
  if (score >= 80) return "hsl(var(--success))";
  if (score >= 60) return "142 60% 55%";
  if (score >= 40) return "hsl(var(--warning))";
  if (score >= 20) return "24 90% 55%";
  return "hsl(var(--destructive))";
}

export function scoreHsl(score: number): string {
  if (score >= 80) return "hsl(142 71% 45%)";
  if (score >= 60) return "hsl(88 60% 48%)";
  if (score >= 40) return "hsl(38 92% 55%)";
  if (score >= 20) return "hsl(24 90% 55%)";
  return "hsl(0 72% 58%)";
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Great";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Critical";
}

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

/** Circular 0–100 score with an accessible numeric center (docs/13 ScoreRing). */
export function ScoreRing({ score, size = 56, strokeWidth = 5, label, className }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color = scoreHsl(score);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-semibold tabular-nums leading-none" style={{ fontSize: size * 0.3, color }}>
          {score}
        </span>
        {label && <span className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

/** Inline sub-score bar for compact contexts. */
export function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums" style={{ color: scoreHsl(score) }}>
          {score}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: scoreHsl(score) }} />
      </div>
    </div>
  );
}
