/**
 * Domain types — frontend projection of docs/04-database-schema.md.
 * Enum string-unions mirror the Prisma enums exactly so this code drops straight
 * onto the real API in a later milestone with no shape changes.
 */

export type OpportunityType =
  | "BROKEN_SITE"
  | "OUTDATED"
  | "SLOW"
  | "NO_SSL"
  | "NOT_RESPONSIVE"
  | "BAD_UX"
  | "SEO"
  | "NO_ECOMMERCE"
  | "POOR_BRANDING"
  | "NO_SOCIAL"
  | "APP_POOR"
  | "APP_STALE"
  | "DIGITAL_TRANSFORM";

export type Stage =
  | "NEW"
  | "RESEARCH"
  | "CONTACTED"
  | "MEETING"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export type LeadStatus = "ACTIVE" | "ARCHIVED" | "DUPLICATE" | "DO_NOT_CONTACT";
export type VerifyStatus = "VALID" | "RISKY" | "INVALID" | "UNKNOWN";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type DecisionRole = "CEO" | "FOUNDER" | "MARKETING" | "IT" | "SALES" | "OPERATIONS" | "OTHER";
export type WebsiteStatus = "ONLINE" | "OFFLINE" | "DNS_ERROR" | "SSL_ERROR" | "REDIRECT_ERROR" | "TIMEOUT";
export type AppStatus = "NONE" | "HEALTHY" | "STALE" | "POOR";

export interface Contact {
  id: string;
  fullName: string;
  title: string;
  role: DecisionRole;
  email: string;
  emailStatus: VerifyStatus;
  emailConfidence: number;
  phone?: string;
  linkedin?: string;
  isPrimary: boolean;
}

export interface AuditFinding {
  code: string;
  title: string;
  detail: string;
  severity: Severity;
  category: "performance" | "security" | "seo" | "ux" | "content" | "legal";
}

export interface WebsiteAudit {
  sslValid: boolean;
  perfScore: number;
  lcpMs: number;
  clsScore: number;
  seoScore: number;
  securityScore: number;
  accessibilityScore: number;
  overallScore: number;
  mobileFriendly: boolean;
  hasAnalytics: boolean;
  hasSchema: boolean;
  findings: AuditFinding[];
}

export interface UiAudit {
  uiScore: number;
  uxScore: number;
  trustScore: number;
  brandingScore: number;
  conversionScore: number;
  modernScore: number;
  summary: string;
}

export interface ScoreFactor {
  key: string;
  label: string;
  weight: number;
  value: number; // 0-100 contribution normalized
}

export interface ActivityItem {
  id: string;
  type: string;
  label: string;
  actor: string;
  at: string; // ISO
}

export interface Note {
  id: string;
  author: string;
  body: string;
  at: string;
}

export interface Lead {
  id: string;
  company: string;
  domain: string;
  website: string;
  ownerName: string;
  industry: string;
  category: string;
  opportunityType: OpportunityType[];
  // geo
  country: string;
  countryCode: string;
  state: string;
  city: string;
  // firmographics
  employees: number;
  revenueMinor: number;
  currency: string;
  techStack: string[];
  cms: string;
  hosting: string;
  domainAgeDays: number;
  trafficBand: string;
  // scores
  leadScore: number;
  websiteScore: number;
  uiScore: number;
  seoScore: number;
  appScore?: number;
  scoreFactors: ScoreFactor[];
  // status
  websiteStatus: WebsiteStatus;
  appStatus: AppStatus;
  playStoreUrl?: string;
  appStoreUrl?: string;
  stage: Stage;
  status: LeadStatus;
  assignedTo?: string;
  tags: string[];
  source: string;
  screenshotUrl: string;
  logoUrl: string;
  // relations
  contacts: Contact[];
  websiteAudit: WebsiteAudit;
  uiAudit: UiAudit;
  activity: ActivityItem[];
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

/** Compact projection used by the dashboard "recent discoveries" feed. */
export interface RecentDiscovery {
  id: string;
  company: string;
  logoUrl: string;
  domain: string;
  leadScore: number;
  opportunity: OpportunityType;
  source: string;
  at: string;
}

export interface Kpi {
  key: string;
  label: string;
  value: number;
  format: "number" | "compact" | "currency" | "percent";
  delta: number; // % change vs prior period
  spark: number[];
  icon: string;
  accent: "primary" | "accent" | "success" | "warning" | "info" | "destructive";
}

export interface SeriesPoint {
  date: string;
  leads: number;
  qualified: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  kind: "discovery" | "reply" | "system" | "score" | "task";
}

export interface SessionUser {
  name: string;
  email: string;
  org: string;
  role: string;
  avatarUrl: string;
}

/* ── Campaigns (docs/04 Campaign/Sequence/SequenceStep/Event) ── */
export type CampaignStatus = "ACTIVE" | "DRAFT" | "PAUSED" | "COMPLETED";
export type StepChannel = "EMAIL" | "LINKEDIN";

export interface SequenceStepDef {
  id: string;
  order: number;
  channel: StepChannel;
  delayDays: number;
  subject: string;
  body: string;
}

export interface CampaignStats {
  enrolled: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  mailbox: string;
  audience: string;
  createdAt: string;
  steps: SequenceStepDef[];
  stats: CampaignStats;
}
