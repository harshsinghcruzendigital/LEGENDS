"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Search, ListFilter, SlidersHorizontal, X, Check, Columns3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";
import { type LeadFilterState, EMPTY_FILTERS } from "@/lib/leads-query";

// Re-exported for backwards compatibility with existing imports.
export { EMPTY_FILTERS };
export type { LeadFilterState };

const STAGE_OPTS = ["NEW", "RESEARCH", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
const STATUS_OPTS = ["ONLINE", "OFFLINE", "DNS_ERROR", "SSL_ERROR", "REDIRECT_ERROR", "TIMEOUT"];
const SCORE_PRESETS: { key: LeadFilterState["scorePreset"]; label: string }[] = [
  { key: "all", label: "All scores" },
  { key: "80", label: "Qualified · 80+" },
  { key: "60", label: "Warm · 60+" },
  { key: "low", label: "Low · <40" },
];

export function LeadFilters({
  filters,
  setFilters,
  industries,
  countries,
  table,
  total,
  filtered,
}: {
  filters: LeadFilterState;
  setFilters: React.Dispatch<React.SetStateAction<LeadFilterState>>;
  industries: string[];
  countries: string[];
  table: Table<Lead>;
  total: number;
  filtered: number;
}) {
  const activeCount =
    filters.stages.length +
    filters.websiteStatuses.length +
    filters.industries.length +
    (filters.countries?.length || 0) +
    (filters.scorePreset !== "all" ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search company, domain, city…"
            className="h-9 pl-9"
          />
        </div>

        <FacetFilter label="Stage" options={STAGE_OPTS.map((s) => ({ value: s, label: title(s) }))} selected={filters.stages} onChange={(v) => setFilters((f) => ({ ...f, stages: v }))} />
        <FacetFilter label="Website" options={STATUS_OPTS.map((s) => ({ value: s, label: title(s) }))} selected={filters.websiteStatuses} onChange={(v) => setFilters((f) => ({ ...f, websiteStatuses: v }))} />
        <FacetFilter label="Industry" options={industries.map((s) => ({ value: s, label: s }))} selected={filters.industries} onChange={(v) => setFilters((f) => ({ ...f, industries: v }))} />
        <FacetFilter label="Country" options={countries.map((s) => ({ value: s, label: s }))} selected={filters.countries || []} onChange={(v) => setFilters((f) => ({ ...f, countries: v }))} />

        {/* Score preset */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <SlidersHorizontal className="h-4 w-4" /> Score
              {filters.scorePreset !== "all" && <Badge variant="secondary" className="ml-1">{SCORE_PRESETS.find((p) => p.key === filters.scorePreset)?.label}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-1">
            {SCORE_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => setFilters((f) => ({ ...f, scorePreset: p.key }))}
                className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary", filters.scorePreset === p.key && "text-primary")}
              >
                <Check className={cn("h-4 w-4", filters.scorePreset === p.key ? "opacity-100" : "opacity-0")} />
                {p.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Verified only */}
        <label className="flex h-9 items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm">
          <Switch checked={filters.verifiedOnly} onCheckedChange={(v) => setFilters((f) => ({ ...f, verifiedOnly: v }))} />
          <span className="text-muted-foreground">Verified only</span>
        </label>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={() => setFilters((f) => ({ ...EMPTY_FILTERS, search: f.search }))}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto h-9">
              <Columns3 className="h-4 w-4" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((c) => (
                <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)} onSelect={(e) => e.preventDefault()}>
                  {title(c.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ListFilter className="h-3.5 w-3.5" />
        Showing <span className="font-medium text-foreground">{filtered}</span> of {total} leads
        {activeCount > 0 && <span>· {activeCount} filter{activeCount > 1 ? "s" : ""} active</span>}
      </div>
    </div>
  );
}

function FacetFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => (selected.includes(v) ? onChange(selected.filter((x) => x !== v)) : onChange([...selected, v]));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <ListFilter className="h-4 w-4" /> {label}
          {selected.length > 0 && <Badge variant="secondary" className="ml-1 tabular-nums">{selected.length}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 w-52 overflow-y-auto scrollbar-thin p-1">
        {options.map((o) => (
          <button key={o.value} onClick={() => toggle(o.value)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary">
            <span className={cn("flex h-4 w-4 items-center justify-center rounded border border-border", selected.includes(o.value) && "border-primary bg-primary text-primary-foreground")}>
              {selected.includes(o.value) && <Check className="h-3 w-3" />}
            </span>
            <span className="truncate">{o.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function title(s: string): string {
  const map: Record<string, string> = {
    revenueMinor: "Revenue",
    createdAt: "Created",
    assignedTo: "Assigned",
    websiteScore: "Website Score",
    leadScore: "Lead Score",
    websiteStatus: "Website",
    opportunityType: "Opportunity",
    DNS_ERROR: "DNS Error",
    SSL_ERROR: "SSL Error",
    REDIRECT_ERROR: "Redirect Error",
    TIMEOUT: "Timeout",
    OFFLINE: "Offline",
    ONLINE: "Online"
  };
  if (map[s]) return map[s];
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ");
}
