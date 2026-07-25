/**
 * Real website audit (docs/03 §3, docs/10 §4). Fetches the target's OWN public
 * page server-side and measures genuine signals: SSL, security headers, SEO tags,
 * mobile viewport, tech fingerprint, TTFB, page weight. Fast + reliable (fits the
 * serverless budget). Optional Google PageSpeed enrichment when PAGESPEED_API_KEY
 * is set. This is the first REAL data source — no scraping of third parties, just
 * auditing the URL the user provides.
 */
import type { AuditFinding, Severity } from "@/lib/types";

export interface AuditResult {
  inputUrl: string;
  finalUrl: string;
  domain: string;
  reachable: boolean;
  statusCode: number;
  sslValid: boolean;
  ttfbMs: number;
  pageWeightKb: number;
  title: string;
  hasTitle: boolean;
  hasMetaDesc: boolean;
  hasViewport: boolean;
  hasLang: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  hasSchema: boolean;
  h1Count: number;
  hasContactForm: boolean;
  hasAnalytics: boolean;
  hasPixel: boolean;
  hasLiveChat: boolean;
  securityHeaders: { hsts: boolean; csp: boolean; xfo: boolean; xcto: boolean; referrer: boolean };
  techStack: string[];
  cms: string;
  hosting: string;
  domainAgeDays: number;
  seoScore: number;
  securityScore: number;
  perfScore: number;
  mobileScore: number;
  accessibilityScore: number;
  overallScore: number;
  perfSource: "pagespeed" | "measured";
  findings: AuditFinding[];
  error?: string;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function normalizeUrl(input: string): string | null {
  let u = input.trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    // SSRF guard: only http(s), block obvious internal hosts
    if (!/^https?:$/.test(parsed.protocol)) return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "127.0.0.1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === "0.0.0.0" ||
      !host.includes(".")
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function canonicalDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  }
}

function detectTech(html: string, headers: Headers): { tech: string[]; cms: string; hosting: string } {
  const tech = new Set<string>();
  const h = (k: string) => (headers.get(k) || "").toLowerCase();
  const body = html.toLowerCase();
  let cms = "Unknown";

  const generator = /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] || "";
  if (/wordpress/i.test(generator) || body.includes("/wp-content/") || body.includes("/wp-includes/")) { cms = "WordPress"; tech.add("WordPress"); }
  if (body.includes("cdn.shopify.com") || body.includes("shopifycdn.com") || h("x-shopify-stage") || h("x-shopid")) { cms = "Shopify"; tech.add("Shopify"); }
  if (body.includes("static.wixstatic.com") || h("x-wix-request-id")) { cms = "Wix"; tech.add("Wix"); }
  if (body.includes("static1.squarespace.com") || body.includes("squarespace-cdn.com")) { cms = "Squarespace"; tech.add("Squarespace"); }
  if (body.includes("/wp-content/plugins/woocommerce")) { cms = "WooCommerce"; tech.add("WooCommerce"); }
  if (/webflow/i.test(generator) || body.includes(".webflow.io")) { cms = "Webflow"; tech.add("Webflow"); }
  if (body.includes("/_next/") || body.includes("__next")) tech.add("Next.js");
  if (body.includes("react-dom") || body.includes("data-reactroot") || body.includes("__reactcontainer")) tech.add("React");
  if (body.includes("/jquery") || body.includes("jquery.min.js")) tech.add("jQuery");
  if (body.includes("bootstrap")) tech.add("Bootstrap");
  if (body.includes("googletagmanager")) tech.add("Google Tag Manager");
  if (body.includes("google-analytics") || body.includes("gtag(")) tech.add("Google Analytics");
  if (body.includes("connect.facebook.net") || body.includes("fbq(")) tech.add("Meta Pixel");

  const server = h("server");
  let hosting = "Unknown";
  if (h("x-vercel-id") || server.includes("vercel")) hosting = "Vercel";
  else if (h("cf-ray") || server.includes("cloudflare")) hosting = "Cloudflare";
  else if (server.includes("nginx")) hosting = "Nginx";
  else if (server.includes("apache")) hosting = "Apache";
  else if (h("x-amz-cf-id") || server.includes("amazons3") || server.includes("aws")) hosting = "AWS";
  else if (server) hosting = server.split("/")[0];

  return { tech: [...tech], cms, hosting };
}

async function tryPageSpeed(url: string): Promise<{ perf: number; a11y: number } | null> {
  const key = process.env.PAGESPEED_API_KEY;
  if (!key) return null; // opt-in only, keeps the function fast by default
  try {
    const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&category=accessibility&url=${encodeURIComponent(url)}&key=${key}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(api, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    const cats = data?.lighthouseResult?.categories;
    if (!cats) return null;
    return { perf: Math.round((cats.performance?.score ?? 0) * 100), a11y: Math.round((cats.accessibility?.score ?? 0) * 100) };
  } catch {
    return null;
  }
}

/** Real domain registration age via RDAP (free, keyless registry protocol). */
async function domainAge(domain: string): Promise<number> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/rdap+json",
        // rdap.org 403s requests without a UA (Node fetch sends none by default)
        "User-Agent": "LeadGenEngineBot/1.0 (+https://legends-coral.vercel.app/bot)",
      },
    });
    clearTimeout(t);
    if (!res.ok) return 0;
    const data = (await res.json()) as { events?: { eventAction?: string; eventDate?: string }[] };
    const reg = (data.events ?? []).find((e) => e.eventAction === "registration");
    if (!reg?.eventDate) return 0;
    return Math.max(0, Math.round((Date.now() - Date.parse(reg.eventDate)) / 86_400_000));
  } catch {
    return 0;
  }
}

export async function auditWebsite(input: string): Promise<AuditResult> {
  const url = normalizeUrl(input);
  const domain = url ? canonicalDomain(url) : canonicalDomain(input);
  const rdapPromise = domain ? domainAge(domain) : Promise.resolve(0); // runs concurrently with the fetch
  const base: AuditResult = {
    inputUrl: input, finalUrl: url ?? input, domain, reachable: false, statusCode: 0, sslValid: false,
    ttfbMs: 0, pageWeightKb: 0, title: "", hasTitle: false, hasMetaDesc: false, hasViewport: false,
    hasLang: false, hasCanonical: false, hasOg: false, hasSchema: false, h1Count: 0, hasContactForm: false,
    hasAnalytics: false, hasPixel: false, hasLiveChat: false,
    securityHeaders: { hsts: false, csp: false, xfo: false, xcto: false, referrer: false },
    techStack: [], cms: "Unknown", hosting: "Unknown", domainAgeDays: 0,
    seoScore: 0, securityScore: 0, perfScore: 0, mobileScore: 0, accessibilityScore: 0, overallScore: 0,
    perfSource: "measured", findings: [],
  };

  if (!url) {
    return { ...base, error: "Invalid or unsupported URL." };
  }

  const started = Date.now();
  let res: Response;
  let html = "";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "LeadGenEngineBot/1.0 (+https://legends-coral.vercel.app/bot; website audit)" },
    });
    const ttfb = Date.now() - started;
    const text = await res.text();
    clearTimeout(t);
    html = text.slice(0, 600_000);
    base.reachable = true;
    base.statusCode = res.status;
    base.finalUrl = res.url || url;
    base.sslValid = base.finalUrl.startsWith("https://");
    base.ttfbMs = ttfb;
    base.pageWeightKb = Math.round(new Blob([text]).size / 1024);
  } catch (e) {
    return { ...base, error: e instanceof Error && e.name === "AbortError" ? "Site timed out (>8s)." : "Site unreachable." };
  }

  const headers = res.headers;
  const has = (re: RegExp) => re.test(html);
  base.title = (/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] || "").trim().slice(0, 200);
  base.hasTitle = base.title.length > 0;
  base.hasMetaDesc = has(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10,}/i);
  base.hasViewport = has(/<meta[^>]+name=["']viewport["']/i);
  base.hasLang = has(/<html[^>]+lang=/i);
  base.hasCanonical = has(/<link[^>]+rel=["']canonical["']/i);
  base.hasOg = has(/<meta[^>]+property=["']og:/i);
  base.hasSchema = has(/application\/ld\+json/i) || has(/itemscope/i);
  base.h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  base.hasContactForm = has(/<form/i);
  base.hasAnalytics = has(/google-analytics|gtag\(|googletagmanager/i);
  base.hasPixel = has(/fbq\(|connect\.facebook\.net/i);
  base.hasLiveChat = has(/intercom|drift|tawk|crisp\.chat|zendesk|livechat/i);

  const hh = (k: string) => headers.get(k) !== null;
  base.securityHeaders = {
    hsts: hh("strict-transport-security"),
    csp: hh("content-security-policy"),
    xfo: hh("x-frame-options"),
    xcto: hh("x-content-type-options"),
    referrer: hh("referrer-policy"),
  };

  const { tech, cms, hosting } = detectTech(html, headers);
  base.techStack = tech;
  base.cms = cms;
  base.hosting = hosting;

  // ── real scoring from measured signals ──
  const sec = base.securityHeaders;
  base.securityScore = clamp(
    (base.sslValid ? 55 : 0) + (sec.hsts ? 15 : 0) + (sec.csp ? 12 : 0) + (sec.xfo ? 8 : 0) + (sec.xcto ? 5 : 0) + (sec.referrer ? 5 : 0),
  );
  base.seoScore = clamp(
    (base.hasTitle ? 22 : 0) + (base.hasMetaDesc ? 20 : 0) + (base.h1Count > 0 ? 14 : 0) + (base.hasCanonical ? 12 : 0) +
    (base.hasSchema ? 12 : 0) + (base.hasOg ? 10 : 0) + (base.hasLang ? 10 : 0),
  );
  base.mobileScore = base.hasViewport ? 92 : 28;
  const ttfb = base.ttfbMs;
  let perf = ttfb < 300 ? 92 : ttfb < 700 ? 80 : ttfb < 1200 ? 66 : ttfb < 2500 ? 48 : ttfb < 5000 ? 30 : 15;
  if (base.pageWeightKb > 3000) perf -= 20;
  else if (base.pageWeightKb > 1500) perf -= 10;
  base.perfScore = clamp(perf);
  base.accessibilityScore = clamp((base.hasLang ? 40 : 0) + (base.hasViewport ? 30 : 0) + (base.hasTitle ? 15 : 0) + (base.h1Count > 0 ? 15 : 0));

  const ps = await tryPageSpeed(base.finalUrl);
  if (ps) {
    base.perfScore = ps.perf;
    base.accessibilityScore = ps.a11y;
    base.perfSource = "pagespeed";
  }

  base.overallScore = clamp(base.perfScore * 0.3 + base.seoScore * 0.25 + base.securityScore * 0.25 + base.mobileScore * 0.2);

  // ── findings ──
  const add = (code: string, title: string, detail: string, severity: Severity, category: AuditFinding["category"]) =>
    base.findings.push({ code, title, detail, severity, category });

  if (!base.sslValid) add("NO_SSL", "No HTTPS / SSL", "The site did not resolve over HTTPS. Browsers flag it 'Not secure', hurting trust and SEO.", "CRITICAL", "security");
  if (base.statusCode >= 400) add("HTTP_ERROR", `HTTP ${base.statusCode}`, "The homepage returned an error status.", "CRITICAL", "content");
  if (!base.hasViewport) add("NO_VIEWPORT", "Not mobile-responsive", "No responsive viewport meta tag — layout breaks on phones, where most traffic is.", "HIGH", "ux");
  if (base.perfScore < 50) add("SLOW", "Slow to load", `Time-to-first-byte was ${base.ttfbMs}ms and the page is ${base.pageWeightKb}KB. Visitors abandon slow pages.`, "HIGH", "performance");
  if (!base.hasTitle) add("NO_TITLE", "Missing page title", "No <title> tag — critical for search rankings and click-through.", "HIGH", "seo");
  if (!base.hasMetaDesc) add("NO_META", "Missing meta description", "No meta description — reduces search click-through rate.", "MEDIUM", "seo");
  if (!base.hasSchema) add("NO_SCHEMA", "No structured data", "No schema.org markup — misses rich search results.", "MEDIUM", "seo");
  if (!sec.hsts) add("NO_HSTS", "No HSTS header", "Missing Strict-Transport-Security — a basic security hardening gap.", "LOW", "security");
  if (!base.hasAnalytics && !base.hasPixel) add("NO_TRACKING", "No analytics or pixel", "No analytics/marketing pixel found — attribution and retargeting are impossible.", "LOW", "seo");
  if (!base.hasContactForm) add("NO_FORM", "No contact form detected", "No form found on the homepage — a conversion/lead-capture gap.", "LOW", "content");

  base.domainAgeDays = await rdapPromise;

  return base;
}
