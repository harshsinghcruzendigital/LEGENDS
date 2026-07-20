/**
 * Milestone-2 Lead Discovery engine (client-side simulation of docs/10 §7 flow).
 * Pure helpers + types + a localStorage-backed runs store. The staged run
 * mirrors the real pipeline: collect → dedupe → audit → enrich → score → promote.
 */
import * as React from "react";
import {
  Search,
  MapPin,
  ShoppingBag,
  Smartphone,
  Share2,
  BookMarked,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import type { Lead, OpportunityType } from "@/lib/types";
import { discoverLeads } from "@/lib/mock/leads";
import { INDUSTRIES } from "@/lib/mock/pools";

export interface SourceDef {
  id: string;
  label: string;
  compliant: "api" | "site-audit" | "directory";
}
export interface SourceGroup {
  group: string;
  icon: LucideIcon;
  sources: SourceDef[];
}

/** Grouped source catalog — mirrors docs/02 discovery source picker + docs/10 registry. */
export const SOURCE_CATALOG: SourceGroup[] = [
  {
    group: "Search",
    icon: Search,
    sources: [
      { id: "google_search", label: "Google Search", compliant: "api" },
      { id: "serp", label: "SERP / Bing", compliant: "api" },
      { id: "duckduckgo", label: "DuckDuckGo", compliant: "api" },
    ],
  },
  {
    group: "Maps & Local",
    icon: MapPin,
    sources: [
      { id: "google_places", label: "Google Maps", compliant: "api" },
      { id: "yelp", label: "Yelp", compliant: "api" },
      { id: "justdial", label: "JustDial", compliant: "api" },
    ],
  },
  {
    group: "Marketplaces",
    icon: ShoppingBag,
    sources: [
      { id: "amazon", label: "Amazon", compliant: "api" },
      { id: "etsy", label: "Etsy", compliant: "api" },
      { id: "flipkart", label: "Flipkart", compliant: "api" },
    ],
  },
  {
    group: "App Stores",
    icon: Smartphone,
    sources: [
      { id: "play_store", label: "Google Play", compliant: "api" },
      { id: "app_store", label: "Apple App Store", compliant: "api" },
    ],
  },
  {
    group: "Social",
    icon: Share2,
    sources: [
      { id: "linkedin", label: "LinkedIn", compliant: "api" },
      { id: "instagram", label: "Instagram", compliant: "api" },
    ],
  },
  {
    group: "Directories",
    icon: BookMarked,
    sources: [
      { id: "clutch", label: "Clutch", compliant: "directory" },
      { id: "goodfirms", label: "GoodFirms", compliant: "directory" },
    ],
  },
  {
    group: "Platforms",
    icon: Boxes,
    sources: [
      { id: "shopify", label: "Shopify Stores", compliant: "site-audit" },
      { id: "wordpress", label: "WordPress Sites", compliant: "site-audit" },
      { id: "woocommerce", label: "WooCommerce", compliant: "site-audit" },
    ],
  },
];

export const ALL_SOURCE_IDS = SOURCE_CATALOG.flatMap((g) => g.sources.map((s) => s.id));
export function sourceLabel(id: string): string {
  for (const g of SOURCE_CATALOG) {
    const s = g.sources.find((x) => x.id === id);
    if (s) return s.label;
  }
  return id;
}

export const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany",
  "Netherlands", "Ireland", "India", "United Arab Emirates",
];

export interface DiscoveryConfig {
  sources: string[];
  industries: string[];
  countries: string[];
  opportunities: OpportunityType[];
  keywords: string;
  minScore: number;
  limit: number;
}

export const DEFAULT_CONFIG: DiscoveryConfig = {
  sources: ["google_places", "serp", "shopify"],
  industries: [],
  countries: [],
  opportunities: [],
  keywords: "",
  minScore: 0,
  limit: 25,
};

export const INDUSTRY_OPTIONS = [...INDUSTRIES];

/** Deterministic seed from a config so re-running the same ICP yields the same results. */
export function seedFromConfig(config: DiscoveryConfig): number {
  const str = JSON.stringify({
    s: [...config.sources].sort(),
    i: [...config.industries].sort(),
    c: [...config.countries].sort(),
    o: [...config.opportunities].sort(),
    k: config.keywords.trim().toLowerCase(),
    m: config.minScore,
  });
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Rough result estimate (before running) based on sources × breadth. */
export function estimateResults(config: DiscoveryConfig): { count: number; credits: number } {
  const breadth =
    (config.sources.length || 1) *
    (config.industries.length ? config.industries.length : 4) *
    (config.countries.length ? config.countries.length : 3);
  const raw = Math.min(config.limit, Math.max(6, Math.round(breadth * 1.4)));
  // credits: 1 discover + 3 website + 2 ui + 2 enrich + 1 verify + 1 score per lead ≈ 10
  return { count: raw, credits: raw * 10 };
}

export type RunStageKey = "collect" | "dedupe" | "audit" | "enrich" | "score" | "done";

export interface RunStageDef {
  key: RunStageKey;
  label: string;
  detail: string;
}

export const RUN_STAGES: RunStageDef[] = [
  { key: "collect", label: "Collecting", detail: "Querying sources via compliant APIs" },
  { key: "dedupe", label: "De-duplicating", detail: "Canonicalizing domains & merging sources" },
  { key: "audit", label: "Auditing", detail: "Lighthouse, SSL, tech & AI-vision UI scoring" },
  { key: "enrich", label: "Enriching", detail: "Resolving contacts, firmographics & decision-makers" },
  { key: "score", label: "Scoring", detail: "Computing explainable 0–100 opportunity score" },
  { key: "done", label: "Complete", detail: "Promoted to your Lead Database" },
];

export interface DiscoveryRunRecord {
  id: string;
  name: string;
  config: DiscoveryConfig;
  seed: number;
  count: number;
  qualified: number;
  createdAt: string;
}

/** Produce the actual leads for a run (filtered to minScore). */
export function runResults(config: DiscoveryConfig, seed: number): Lead[] {
  const { count } = estimateResults(config);
  const batch = discoverLeads(count, seed, {
    industries: config.industries,
    countries: config.countries,
    opportunities: config.opportunities,
    sources: config.sources,
  });
  const filtered = config.minScore > 0 ? batch.filter((l) => l.leadScore >= config.minScore) : batch;
  return filtered.sort((a, b) => b.leadScore - a.leadScore);
}

const RUNS_KEY = "leadgen:discovery-runs";

/** localStorage-backed run history (persists across navigation without a backend). */
export function useDiscoveryRuns() {
  const [runs, setRuns] = React.useState<DiscoveryRunRecord[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(RUNS_KEY);
      if (raw) setRuns(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const addRun = React.useCallback((run: DiscoveryRunRecord) => {
    setRuns((prev) => {
      const next = [run, ...prev].slice(0, 20);
      try {
        localStorage.setItem(RUNS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clearRuns = React.useCallback(() => {
    setRuns([]);
    try {
      localStorage.removeItem(RUNS_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { runs, addRun, clearRuns };
}
