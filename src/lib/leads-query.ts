/**
 * Pure lead query logic — filter / sort / paginate. Shared by the client (filter
 * UI) and the server (repository). Because it's pure and I/O-free, the tRPC
 * repository uses it today over mock data and swaps to SQL later with an
 * identical input/output contract (docs/04 §11 Filter DSL, docs/08 leads.list).
 */
import type { Lead } from "@/lib/types";

export interface LeadFilterState {
  search: string;
  stages: string[];
  websiteStatuses: string[];
  industries: string[];
  countries: string[];
  scorePreset: "all" | "80" | "60" | "low";
  verifiedOnly: boolean;
}

export const EMPTY_FILTERS: LeadFilterState = {
  search: "",
  stages: [],
  websiteStatuses: [],
  industries: [],
  countries: [],
  scorePreset: "all",
  verifiedOnly: false,
};

export type LeadSortField =
  | "leadScore"
  | "websiteScore"
  | "company"
  | "createdAt"
  | "employees"
  | "revenueMinor";

export interface LeadSort {
  field: LeadSortField;
  dir: "asc" | "desc";
}

export interface LeadListInput {
  filter: LeadFilterState;
  sort: LeadSort;
  page: number;
  limit: number;
}

export interface LeadListResult {
  items: Lead[];
  total: number;
  page: number;
  pageCount: number;
  facets: { industries: string[]; countries: string[] };
}

export function applyLeadFilters(rows: Lead[], f: LeadFilterState): Lead[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((l) => {
    if (q && !`${l.company} ${l.domain} ${l.city} ${l.country} ${l.industry}`.toLowerCase().includes(q)) return false;
    if (f.stages.length && !f.stages.includes(l.stage)) return false;
    if (f.websiteStatuses.length && !f.websiteStatuses.includes(l.websiteStatus)) return false;
    if (f.industries.length && !f.industries.includes(l.industry)) return false;
    if (f.countries && f.countries.length && !f.countries.includes(l.country)) return false;
    if (f.scorePreset === "80" && l.leadScore < 80) return false;
    if (f.scorePreset === "60" && l.leadScore < 60) return false;
    if (f.scorePreset === "low" && l.leadScore >= 40) return false;
    if (f.verifiedOnly && !l.contacts.some((c) => c.emailStatus === "VALID")) return false;
    return true;
  });
}

export function sortLeads(rows: Lead[], { field, dir }: LeadSort): Lead[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
    return String(av).localeCompare(String(bv)) * mul;
  });
}

/** The full query: filter → sort → paginate. Deterministic + pure. */
export function queryLeads(all: Lead[], input: LeadListInput): LeadListResult {
  const filtered = applyLeadFilters(all, input.filter);
  const sorted = sortLeads(filtered, input.sort);
  const limit = Math.max(1, Math.min(100, input.limit));
  const pageCount = Math.max(1, Math.ceil(sorted.length / limit));
  const page = Math.min(Math.max(0, input.page), pageCount - 1);
  const items = sorted.slice(page * limit, page * limit + limit);
  return {
    items,
    total: filtered.length,
    page,
    pageCount,
    facets: {
      industries: Array.from(new Set(all.map((l) => l.industry))).sort(),
      countries: Array.from(new Set(all.map((l) => l.country))).sort(),
    },
  };
}
