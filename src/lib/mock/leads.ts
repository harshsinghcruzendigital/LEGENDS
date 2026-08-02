/**
 * Deterministic mock Lead dataset. Generated once from a fixed seed so every
 * render (server + client) is identical — no hydration drift. Shapes match
 * docs/04-database-schema.md so this swaps onto the real API unchanged.
 */
import type {
  Lead,
  Contact,
  OpportunityType,
  Stage,
  VerifyStatus,
  WebsiteStatus,
  AppStatus,
  AuditFinding,
  ScoreFactor,
} from "@/lib/types";
import { mulberry32, pick, pickWeighted, randInt, sample } from "@/lib/utils";
import {
  INDUSTRIES,
  COMPANY_PREFIXES,
  COMPANY_SUFFIXES,
  CITIES,
  CMS_OPTIONS,
  HOSTING_OPTIONS,
  TECH_POOL,
  TRAFFIC_BANDS,
  FIRST_NAMES,
  LAST_NAMES,
  OWNER_ASSIGNEES,
  SOURCES,
  OPPORTUNITY_TYPES,
  FINDING_TEMPLATES,
} from "@/lib/mock/pools";

const BASE_TIME = Date.parse("2026-07-18T12:00:00Z");
const STAGES: Stage[] = ["NEW", "RESEARCH", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
const DEC_TITLES: [string, Contact["role"]][] = [
  ["Founder & CEO", "CEO"],
  ["Co-Founder", "FOUNDER"],
  ["Owner", "CEO"],
  ["Head of Marketing", "MARKETING"],
  ["Marketing Director", "MARKETING"],
  ["IT Manager", "IT"],
  ["Head of Sales", "SALES"],
  ["Operations Lead", "OPERATIONS"],
];

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "").slice(0, 22);
}

function verifyFrom(rng: () => number): { status: VerifyStatus; conf: number } {
  const status = pickWeighted<VerifyStatus>(rng, [
    ["VALID", 58],
    ["RISKY", 20],
    ["UNKNOWN", 14],
    ["INVALID", 8],
  ]);
  const conf =
    status === "VALID" ? randInt(rng, 88, 99) : status === "RISKY" ? randInt(rng, 55, 80) : status === "UNKNOWN" ? randInt(rng, 30, 55) : randInt(rng, 5, 25);
  return { status, conf };
}

function buildContacts(rng: () => number, domain: string, ownerFirst: string, ownerLast: string): Contact[] {
  const count = randInt(rng, 1, 3);
  const out: Contact[] = [];
  for (let i = 0; i < count; i++) {
    const first = i === 0 ? ownerFirst : pick(rng, FIRST_NAMES);
    const last = i === 0 ? ownerLast : pick(rng, LAST_NAMES);
    const [title, role] = i === 0 ? DEC_TITLES[randInt(rng, 0, 2)] : pick(rng, DEC_TITLES.slice(3));
    const v = verifyFrom(rng);
    out.push({
      id: `ct_${domain}_${i}`,
      fullName: `${first} ${last}`,
      title,
      role,
      email: `${first.toLowerCase()}@${domain}`,
      emailStatus: v.status,
      emailConfidence: v.conf,
      phone: rng() > 0.35 ? `+1 (${randInt(rng, 200, 989)}) ${randInt(rng, 200, 989)}-${randInt(rng, 1000, 9999)}` : undefined,
      linkedin: rng() > 0.4 ? `linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}` : undefined,
      isPrimary: i === 0,
    });
  }
  return out;
}

function buildFindings(rng: () => number, opps: OpportunityType[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const o of opps) {
    const t = FINDING_TEMPLATES[o];
    if (t) findings.push({ ...t });
  }
  // always add a couple of common informational findings
  if (rng() > 0.5)
    findings.push({
      code: "NO_PIXEL",
      title: "No marketing pixel installed",
      detail: "No Meta/Google conversion pixel found — retargeting and attribution are impossible.",
      severity: "LOW",
      category: "seo",
    });
  return findings;
}

function computeScoreFactors(rng: () => number, websiteScore: number, employees: number, hasDecisionMaker: boolean): ScoreFactor[] {
  const inv = (n: number) => Math.round(100 - n); // worse website => bigger opportunity
  return [
    { key: "website", label: "Website Quality Gap", weight: 25, value: inv(websiteScore) },
    { key: "urgency", label: "Urgency Signal", weight: 15, value: randInt(rng, 40, 95) },
    { key: "size", label: "Company Size Fit", weight: 15, value: Math.min(100, Math.round((employees / 200) * 100) + randInt(rng, 10, 40)) },
    { key: "seo", label: "SEO Problems", weight: 15, value: randInt(rng, 35, 95) },
    { key: "buy", label: "Likelihood to Buy", weight: 15, value: randInt(rng, 30, 90) },
    { key: "dm", label: "Decision Maker Found", weight: 15, value: hasDecisionMaker ? randInt(rng, 70, 100) : randInt(rng, 10, 40) },
  ];
}

function weightedScore(factors: ScoreFactor[]): number {
  const total = factors.reduce((s, f) => s + f.weight, 0);
  return Math.round(factors.reduce((s, f) => s + (f.value * f.weight) / total, 0));
}

export interface LeadGenConstraints {
  industries?: string[];
  countries?: string[];
  opportunities?: OpportunityType[];
  sources?: string[];
  idPrefix?: string;
}

const REAL_ONLINE_DOMAINS = [
  "google.com", "github.com", "microsoft.com", "apple.com", "wikipedia.org",
  "stripe.com", "vercel.com", "cloudflare.com", "netlify.com", "aws.amazon.com",
  "npm.im", "react.dev", "nextjs.org", "tailwindcss.com", "shadcn.com",
  "mozilla.org", "w3.org", "digitalocean.com", "heroku.com", "git-scm.com",
  "stackoverflow.com", "medium.com", "dev.to", "hashnode.com", "unsplash.com",
  "figma.com", "canva.com", "adobe.com", "dropbox.com", "zoom.us",
  "slack.com", "trello.com", "asana.com", "notion.so", "spotify.com"
];

function generateLeads(count: number, seed = 20260718, constraints?: LeadGenConstraints): Lead[] {
  const rng = mulberry32(seed);
  const leads: Lead[] = [];

  for (let i = 0; i < count; i++) {
    const industry = constraints?.industries?.length ? pick(rng, constraints.industries) : pick(rng, INDUSTRIES);
    const prefix = pick(rng, COMPANY_PREFIXES);
    const suffix = pick(rng, COMPANY_SUFFIXES[industry] ?? ["Co"]);
    const company = `${prefix} ${suffix}`;
    const base = slugify(company);
    const tld = pick(rng, [".com", ".com", ".co", ".io", ".shop", ".net"]);
    let domain = `${base}${tld}`;

    const cityPool = constraints?.countries?.length ? CITIES.filter((c) => constraints.countries!.includes(c.country)) : CITIES;
    const loc = pick(rng, cityPool.length ? cityPool : CITIES);
    const ownerFirst = pick(rng, FIRST_NAMES);
    const ownerLast = pick(rng, LAST_NAMES);

    // opportunity mix — 1..3 problems
    let opps = sample(rng, OPPORTUNITY_TYPES, randInt(rng, 1, 3));
    if (constraints?.opportunities?.length) {
      const forced = pick(rng, constraints.opportunities);
      if (!opps.includes(forced)) opps = [forced, ...opps].slice(0, 3);
    }

    // website score: worse if it has SLOW/BROKEN/NO_SSL/OUTDATED
    const severe = opps.some((o) => ["BROKEN_SITE", "NO_SSL", "SLOW", "NOT_RESPONSIVE"].includes(o));
    const websiteScore = severe ? randInt(rng, 12, 46) : randInt(rng, 40, 78);
    const uiScore = Math.max(8, websiteScore + randInt(rng, -14, 8));
    const seoScore = Math.max(10, websiteScore + randInt(rng, -18, 14));

    const websiteStatus: WebsiteStatus = opps.includes("BROKEN_SITE")
      ? (rng() > 0.6 ? "OFFLINE" : rng() > 0.5 ? "DNS_ERROR" : rng() > 0.5 ? "TIMEOUT" : "REDIRECT_ERROR")
      : opps.includes("NO_SSL")
        ? "SSL_ERROR"
        : "ONLINE";

    if (websiteStatus === "ONLINE") {
      domain = REAL_ONLINE_DOMAINS[(i + seed) % REAL_ONLINE_DOMAINS.length];
    }

    const hasApp = opps.includes("APP_POOR") || opps.includes("APP_STALE") || rng() > 0.7;
    const appStatus: AppStatus = !hasApp
      ? "NONE"
      : opps.includes("APP_POOR")
        ? "POOR"
        : opps.includes("APP_STALE")
          ? "STALE"
          : "HEALTHY";
    const appScore = hasApp ? randInt(rng, appStatus === "POOR" ? 15 : 40, appStatus === "HEALTHY" ? 88 : 60) : undefined;

    const employees = pickWeighted(rng, [
      [randInt(rng, 1, 10), 40],
      [randInt(rng, 11, 50), 32],
      [randInt(rng, 51, 200), 20],
      [randInt(rng, 201, 900), 8],
    ]);
    const revenueMinor = employees * randInt(rng, 80000, 260000) * 100;

    const contacts = buildContacts(rng, domain, ownerFirst, ownerLast);
    const hasDecisionMaker = contacts.some((c) => ["CEO", "FOUNDER"].includes(c.role) && c.emailStatus === "VALID");
    const scoreFactors = computeScoreFactors(rng, websiteScore, employees, hasDecisionMaker);
    const leadScore = weightedScore(scoreFactors);

    const cms = pickWeighted(rng, CMS_OPTIONS);
    const createdOffset = randInt(rng, 0, 45);
    const createdAt = new Date(BASE_TIME - createdOffset * 86400000 - randInt(rng, 0, 86400000)).toISOString();
    const updatedAt = new Date(Date.parse(createdAt) + randInt(rng, 0, createdOffset) * 3600000).toISOString();

    const stage = pickWeighted<Stage>(rng, [
      ["NEW", 34],
      ["RESEARCH", 18],
      ["CONTACTED", 16],
      ["MEETING", 10],
      ["PROPOSAL", 8],
      ["NEGOTIATION", 6],
      ["WON", 4],
      ["LOST", 4],
    ]);

    const findings = buildFindings(rng, opps);
    const overallScore = Math.round((websiteScore + uiScore + seoScore) / 3);

    leads.push({
      id: `${constraints?.idPrefix ?? "ld_"}${String(i + 1).padStart(4, "0")}`,
      company,
      domain,
      website: `https://${domain}`,
      ownerName: `${ownerFirst} ${ownerLast}`,
      industry,
      category: industry,
      opportunityType: opps,
      country: loc.country,
      countryCode: loc.cc,
      state: loc.state,
      city: loc.city,
      employees,
      revenueMinor,
      currency: "USD",
      techStack: sample(rng, TECH_POOL, randInt(rng, 3, 7)),
      cms,
      hosting: pick(rng, HOSTING_OPTIONS),
      domainAgeDays: randInt(rng, 180, 7300),
      trafficBand: pick(rng, TRAFFIC_BANDS),
      leadScore,
      websiteScore,
      uiScore,
      seoScore,
      appScore,
      scoreFactors,
      websiteStatus,
      appStatus,
      playStoreUrl: hasApp && rng() > 0.3 ? `https://play.google.com/store/apps/details?id=com.${base}` : undefined,
      appStoreUrl: hasApp && rng() > 0.5 ? `https://apps.apple.com/app/${base}/id${randInt(rng, 100000000, 999999999)}` : undefined,
      stage,
      status: "ACTIVE",
      assignedTo: pick(rng, OWNER_ASSIGNEES) === "Unassigned" ? undefined : pick(rng, OWNER_ASSIGNEES),
      tags: rng() > 0.6 ? sample(rng, ["hot", "local", "high-value", "quick-win", "enterprise"], randInt(rng, 1, 2)) : [],
      source: constraints?.sources?.length ? pick(rng, constraints.sources) : pick(rng, SOURCES),
      screenshotUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${base}`,
      logoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(company)}&backgroundType=gradientLinear`,
      contacts,
      websiteAudit: {
        sslValid: websiteStatus !== "SSL_ERROR",
        perfScore: websiteScore,
        lcpMs: randInt(rng, 1800, 7200),
        clsScore: Math.round(rng() * 40) / 100,
        seoScore,
        securityScore: websiteStatus === "SSL_ERROR" ? randInt(rng, 10, 35) : randInt(rng, 45, 92),
        accessibilityScore: randInt(rng, 40, 92),
        overallScore,
        mobileFriendly: !opps.includes("NOT_RESPONSIVE"),
        hasAnalytics: rng() > 0.4,
        hasSchema: rng() > 0.6,
        findings,
      },
      uiAudit: {
        uiScore,
        uxScore: Math.max(8, uiScore + randInt(rng, -10, 8)),
        trustScore: Math.max(10, websiteScore + randInt(rng, -8, 12)),
        brandingScore: opps.includes("POOR_BRANDING") ? randInt(rng, 15, 45) : randInt(rng, 45, 85),
        conversionScore: randInt(rng, 20, 80),
        modernScore: opps.includes("OUTDATED") ? randInt(rng, 12, 40) : randInt(rng, 45, 88),
        summary:
          "The site reads as dated and low-trust on mobile. The hero lacks a clear value proposition, CTAs are weak, and typography is inconsistent. A modern redesign with a focused conversion path is the highest-leverage fix.",
      },
      activity: [
        { id: `${seed}a1`, type: "discovered", label: `Discovered via ${pick(rng, SOURCES)}`, actor: "System", at: createdAt },
        { id: `${seed}a2`, type: "audited", label: `Website audited — score ${websiteScore}/100`, actor: "AI Auditor", at: new Date(Date.parse(createdAt) + 120000).toISOString() },
        { id: `${seed}a3`, type: "scored", label: `Lead scored ${leadScore}/100`, actor: "Scoring Engine", at: new Date(Date.parse(createdAt) + 240000).toISOString() },
        ...(stage !== "NEW"
          ? [{ id: `${seed}a4`, type: "stage", label: `Moved to ${stage}`, actor: pick(rng, OWNER_ASSIGNEES), at: updatedAt }]
          : []),
      ],
      notes:
        rng() > 0.6
          ? [
              {
                id: `${seed}n1`,
                author: pick(rng, OWNER_ASSIGNEES.slice(0, 4)),
                body: "Great fit — clearly outdated storefront and they're running paid ads to it. Worth a personalized audit teardown.",
                at: updatedAt,
              },
            ]
          : [],
      createdAt,
      updatedAt,
    });
  }
  return leads;
}

/** The single shared dataset (module singleton). */
export const LEADS: Lead[] = generateLeads(140);

export function getLeadById(id: string): Lead | undefined {
  return LEADS.find((l) => l.id === id);
}

/** Generate a fresh batch reflecting discovery filters (Milestone 2 — docs/10). */
export function discoverLeads(count: number, seed: number, constraints?: LeadGenConstraints): Lead[] {
  return generateLeads(count, seed, { idPrefix: "dq_", ...constraints });
}
