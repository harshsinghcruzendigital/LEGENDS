# 13 — Design System

Premium, enterprise, glass. Dark-first with a fully-realized light mode. Tokens live in `packages/ui/src/tokens`
and feed the Tailwind preset so web + reports + emails stay consistent.

## 1. Design principles

1. **Calm density.** Enterprise data-heavy screens that don't feel cramped — generous line-height, clear hierarchy, restrained color.
2. **Glass as structure, not decoration.** Frosted surfaces separate layers (nav / content / overlays); never so heavy that text contrast fails.
3. **Color = meaning.** Neutral canvas; color reserved for score/severity/status. (Aligns with the `dataviz` skill: color is never the *only* signal.)
4. **Motion with purpose.** Every animation communicates state change; all respect `prefers-reduced-motion`.
5. **Accessible by construction.** WCAG 2.2 AA contrast on every token pairing, in both themes.

## 2. Color tokens (semantic, theme-aware)

Defined as CSS variables; components reference semantic names, never raw hex.

```css
/* DARK (default) */
--bg-canvas:      #0A0B0F;   --bg-surface:    #101218;   --bg-elevated: #161922;
--glass-bg:       rgba(22,25,34,0.55);  --glass-border: rgba(255,255,255,0.08);
--fg-primary:     #F5F7FA;   --fg-muted:      #9AA3B2;   --fg-subtle: #5B6472;
--border:         rgba(255,255,255,0.08);
--brand:          #6D5EF6;   --brand-hover:   #7E70FF;   --brand-fg: #FFFFFF;
--accent:         #22D3EE;                                     /* cyan for highlights */

/* LIGHT */
:root[data-theme="light"]{
  --bg-canvas:    #F7F8FB;   --bg-surface:    #FFFFFF;   --bg-elevated: #FFFFFF;
  --glass-bg:     rgba(255,255,255,0.65);  --glass-border: rgba(15,23,42,0.08);
  --fg-primary:   #0F172A;   --fg-muted:      #475569;   --fg-subtle: #94A3B8;
  --border:       rgba(15,23,42,0.10);
}

/* SEMANTIC STATE (both themes tuned for AA) */
--success:#22C55E; --warning:#F59E0B; --danger:#EF4444; --info:#3B82F6;
/* SCORE SCALE (0→100): red→amber→lime→green, colorblind-safe with icon/label backup */
--score-critical:#EF4444; --score-poor:#F59E0B; --score-fair:#EAB308;
--score-good:#84CC16;     --score-great:#22C55E;
/* SEVERITY */
--sev-critical:#EF4444; --sev-high:#F97316; --sev-medium:#EAB308; --sev-low:#3B82F6; --sev-info:#64748B;
```

> The categorical/sequential palettes for charts follow the `dataviz` skill's palette + validator — load that
> skill before building any chart and swap its placeholder palette for these brand values.

## 3. Typography

- **UI:** Inter (variable). **Numeric/tabular:** Inter with `font-variant-numeric: tabular-nums` for tables/KPIs. **Mono:** JetBrains Mono for code/tech-stack chips.
- Scale (rem): `xs .75 · sm .875 · base 1 · lg 1.125 · xl 1.25 · 2xl 1.5 · 3xl 1.875 · 4xl 2.25 · 5xl 3`.
- Weights: 400 body, 500 UI labels, 600 headings, 700 KPIs. Line-height 1.5 body / 1.2 headings.

## 4. Spacing, radius, elevation

- **Spacing:** 4px base scale (`1=4 · 2=8 · 3=12 · 4=16 · 6=24 · 8=32 · 12=48`).
- **Radius:** `sm 8 · md 12 · lg 16 · xl 20 · 2xl 28 · full`. Cards `lg`, buttons `md`, pills `full`.
- **Elevation:** shadow tokens `e1..e4`; glass surfaces add `backdrop-filter: blur(16px) saturate(140%)` + 1px `--glass-border` top-highlight.

## 5. Glassmorphism recipe (the signature look)

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.24);
}
```
Rules: max **two** glass layers stacked (nav + one overlay) to preserve contrast; text always sits on a solid
inner chip if it would otherwise fail AA over a busy backdrop; a subtle animated aurora/mesh gradient lives on
`--bg-canvas` behind glass — never behind body text.

## 6. Component library (`@leadgen/ui`)

Built on shadcn/ui (Radix primitives → accessibility). Custom composed components:

| Component | Purpose |
|---|---|
| `GlassCard`, `GlassPanel` | frosted containers (variants: flat/elevated/interactive) |
| `StatTile` | KPI tile: label, big tabular number, delta chip, sparkline |
| `KpiRow` | responsive grid of StatTiles (the dashboard top row) |
| `ScoreRing` | circular 0–100 score with color scale + label (a11y text) |
| `ScoreBar` | inline sub-score bar (website/SEO/UI) |
| `SeverityBadge` | finding severity pill w/ icon (never color-only) |
| `StatusBadge` | lead/campaign/email status |
| `DataGrid` | virtualized TanStack table wrapper (sort/filter/select/bulk-bar) |
| `FilterBuilder` | Filter DSL editor (shared: leads, workflows, ICPs) |
| `SlideOver` | right sheet for lead/deal detail (intercepting route) |
| `KanbanBoard` | dnd-kit columns + cards |
| `Timeline` | activity feed |
| `AuditReport` | the shareable report layout (also public `/r/:id`) |
| `AiMessage` | assistant bubble w/ streamed tokens + tool-call chips |
| `EmptyState` | teaching empty states w/ CTA |
| `Sparkline`, `AreaTrend`, `Donut`, `GeoHeatmap`, `Histogram` | Recharts wrappers, palette-locked |
| `CommandPalette` | ⌘K jump + AI actions |
| `UsageMeter` | plan quota progress w/ upgrade CTA |

## 7. Motion (Framer Motion)

| Interaction | Motion |
|---|---|
| Page transition | 200ms fade+rise (8px), `easeOut` |
| Slide-over | 260ms spring from right; backdrop fade |
| KPI mount | count-up (600ms) + fade; stagger 40ms across row |
| Chart reveal | draw/grow on enter, once |
| Kanban drag | lift shadow + scale 1.02; drop spring |
| Command palette | scale 0.98→1 + fade, 160ms |
| To40 / hover prefetch | subtle 120ms |

All wrapped so `prefers-reduced-motion: reduce` → opacity-only, no transform/parallax.

## 8. Data-viz rules (inherit the `dataviz` skill)

- Categorical series use the validated categorical palette; sequential (heatmaps) use a single-hue ramp; diverging only for above/below-baseline.
- Never encode meaning by color alone — pair with label, icon, or position.
- Light + dark variants for every chart; gridlines and axes use `--fg-subtle`.
- Tooltips are keyboard-accessible; legends toggle series.

## 9. Report & email styling

The public audit report (`/r/:publicId`) and cold-email templates use a **restrained subset** of tokens
(brand color from `Org.brandColor`, high-contrast text, no glass — must render in email clients and print).
The report leads with the ScoreRing + one-line hook, then severity-ordered findings with evidence.

## 10. Theming implementation

- `next-themes` toggles `data-theme` on `<html>`; tokens flip via CSS variables (no JS re-render of colors).
- Tailwind preset maps semantic tokens to utilities (`bg-canvas`, `text-muted`, `border-glass`).
- System-default respected; user override persisted per profile.
