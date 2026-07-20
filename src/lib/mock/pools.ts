/** Source pools for deterministic mock generation (docs/04 field domains). */
import type { OpportunityType, Severity } from "@/lib/types";

export const INDUSTRIES = [
  "E-commerce",
  "Home & Furniture",
  "Health & Wellness",
  "Restaurants",
  "Fashion & Apparel",
  "Real Estate",
  "Automotive",
  "Fitness & Gyms",
  "Beauty & Salons",
  "Professional Services",
  "SaaS & Software",
  "Hospitality",
  "Manufacturing",
  "Education",
  "Legal Services",
] as const;

export const COMPANY_PREFIXES = [
  "Nova", "Apex", "Vertex", "Lumen", "Harbor", "Cedar", "Ironwood", "Maple", "Summit", "Crimson",
  "Golden", "Silver", "Urban", "Coastal", "Northern", "Bright", "Pure", "Prime", "Elite", "Metro",
  "Willow", "Onyx", "Solace", "Aria", "Vela", "Terra", "Halcyon", "Copper", "Slate", "Marigold",
];

export const COMPANY_SUFFIXES: Record<string, string[]> = {
  "E-commerce": ["Goods", "Market", "Supply Co", "Trading", "Commerce"],
  "Home & Furniture": ["Interiors", "Home", "Furnishings", "Living", "& Co"],
  "Health & Wellness": ["Wellness", "Health", "Care", "Clinic", "Labs"],
  Restaurants: ["Kitchen", "Bistro", "Eatery", "Grill", "Table"],
  "Fashion & Apparel": ["Apparel", "Threads", "Studio", "Wear", "Label"],
  "Real Estate": ["Realty", "Properties", "Estates", "Homes", "Group"],
  Automotive: ["Motors", "Auto", "Garage", "Automotive", "Works"],
  "Fitness & Gyms": ["Fitness", "Athletics", "Gym", "Strength", "Club"],
  "Beauty & Salons": ["Salon", "Beauty", "Studio", "Spa", "Aesthetics"],
  "Professional Services": ["Partners", "Consulting", "Advisory", "Group", "Associates"],
  "SaaS & Software": ["Labs", "Software", "Systems", "Cloud", "Digital"],
  Hospitality: ["Hotels", "Resorts", "Hospitality", "Suites", "Lodge"],
  Manufacturing: ["Industries", "Manufacturing", "Works", "Fabrication", "Materials"],
  Education: ["Academy", "Learning", "Institute", "Education", "School"],
  "Legal Services": ["Law", "Legal", "& Partners", "Chambers", "LLP"],
};

export const CITIES: { city: string; state: string; country: string; cc: string }[] = [
  { city: "Austin", state: "Texas", country: "United States", cc: "US" },
  { city: "Denver", state: "Colorado", country: "United States", cc: "US" },
  { city: "Miami", state: "Florida", country: "United States", cc: "US" },
  { city: "Seattle", state: "Washington", country: "United States", cc: "US" },
  { city: "Chicago", state: "Illinois", country: "United States", cc: "US" },
  { city: "Brooklyn", state: "New York", country: "United States", cc: "US" },
  { city: "Portland", state: "Oregon", country: "United States", cc: "US" },
  { city: "Nashville", state: "Tennessee", country: "United States", cc: "US" },
  { city: "Toronto", state: "Ontario", country: "Canada", cc: "CA" },
  { city: "Vancouver", state: "British Columbia", country: "Canada", cc: "CA" },
  { city: "London", state: "England", country: "United Kingdom", cc: "GB" },
  { city: "Manchester", state: "England", country: "United Kingdom", cc: "GB" },
  { city: "Sydney", state: "New South Wales", country: "Australia", cc: "AU" },
  { city: "Melbourne", state: "Victoria", country: "Australia", cc: "AU" },
  { city: "Berlin", state: "Berlin", country: "Germany", cc: "DE" },
  { city: "Amsterdam", state: "North Holland", country: "Netherlands", cc: "NL" },
  { city: "Dublin", state: "Leinster", country: "Ireland", cc: "IE" },
  { city: "Bengaluru", state: "Karnataka", country: "India", cc: "IN" },
  { city: "Mumbai", state: "Maharashtra", country: "India", cc: "IN" },
  { city: "Dubai", state: "Dubai", country: "United Arab Emirates", cc: "AE" },
];

export const CMS_OPTIONS: [string, number][] = [
  ["WordPress", 34],
  ["Shopify", 22],
  ["Wix", 12],
  ["Squarespace", 9],
  ["WooCommerce", 8],
  ["Webflow", 5],
  ["Magento", 4],
  ["Custom", 6],
];

export const HOSTING_OPTIONS = ["GoDaddy", "Bluehost", "AWS", "Cloudflare", "SiteGround", "HostGator", "Vercel", "Hostinger"];

export const TECH_POOL = [
  "jQuery", "Bootstrap", "PHP", "Google Analytics", "Font Awesome", "React", "Vue", "Tailwind",
  "Cloudflare", "Google Tag Manager", "Facebook Pixel", "Klaviyo", "Mailchimp", "HubSpot",
  "reCAPTCHA", "Stripe", "PayPal", "Yoast SEO", "Elementor", "Google Fonts",
];

export const TRAFFIC_BANDS = ["0–1k", "1k–10k", "10k–50k", "50k–100k", "100k+"];

export const FIRST_NAMES = [
  "James", "Maria", "David", "Sofia", "Liam", "Emma", "Noah", "Olivia", "Ethan", "Ava",
  "Raj", "Priya", "Chen", "Yuki", "Omar", "Fatima", "Lucas", "Isabella", "Mason", "Mia",
  "Aisha", "Marcus", "Elena", "Tomás", "Nadia",
];
export const LAST_NAMES = [
  "Carter", "Nguyen", "Patel", "Silva", "Kim", "Johnson", "Müller", "Rossi", "Anderson", "Khan",
  "Garcia", "Chen", "O'Brien", "Sato", "Novak", "Reed", "Foster", "Bauer", "Costa", "Hughes",
];

export const OWNER_ASSIGNEES = ["Alex Rivera", "Jordan Blake", "Sam Okafor", "Taylor Chen", "Unassigned"];

export const SOURCES = [
  "Google Maps", "Google Search", "SERP", "Play Store", "App Store", "Shopify Stores",
  "Clutch", "Yelp", "LinkedIn", "Website Scanner",
];

export const OPPORTUNITY_LABELS: Record<OpportunityType, string> = {
  BROKEN_SITE: "Broken Website",
  OUTDATED: "Outdated Design",
  SLOW: "Slow Loading",
  NO_SSL: "Missing SSL",
  NOT_RESPONSIVE: "Not Responsive",
  BAD_UX: "Poor UI/UX",
  SEO: "SEO Issues",
  NO_ECOMMERCE: "No E-commerce",
  POOR_BRANDING: "Poor Branding",
  NO_SOCIAL: "Missing Social",
  APP_POOR: "Poor App Rating",
  APP_STALE: "App Not Updated",
  DIGITAL_TRANSFORM: "Needs Transformation",
};

export const OPPORTUNITY_TYPES = Object.keys(OPPORTUNITY_LABELS) as OpportunityType[];

/** Finding templates keyed by opportunity, used to build realistic audit reports. */
export const FINDING_TEMPLATES: Record<
  string,
  { code: string; title: string; detail: string; severity: Severity; category: AuditFinding["category"] }
> = {
  NO_SSL: {
    code: "NO_SSL",
    title: "No valid SSL certificate",
    detail: "The site is served over HTTP or has an expired certificate. Browsers flag it as 'Not secure', hurting trust and SEO.",
    severity: "CRITICAL",
    category: "security",
  },
  SLOW: {
    code: "LCP_SLOW",
    title: "Largest Contentful Paint is slow",
    detail: "LCP exceeds 4s on mobile. Visitors routinely abandon before the main content renders.",
    severity: "HIGH",
    category: "performance",
  },
  NOT_RESPONSIVE: {
    code: "NO_VIEWPORT",
    title: "Not mobile responsive",
    detail: "No responsive viewport handling — layout breaks below 768px. Most traffic is mobile.",
    severity: "HIGH",
    category: "ux",
  },
  SEO: {
    code: "MISSING_SCHEMA",
    title: "Missing structured data & meta",
    detail: "No schema.org markup and thin meta descriptions reduce rich-result eligibility and CTR.",
    severity: "MEDIUM",
    category: "seo",
  },
  BROKEN_SITE: {
    code: "BROKEN_ASSETS",
    title: "Broken images and links",
    detail: "Multiple 404 assets and dead internal links detected across key pages.",
    severity: "HIGH",
    category: "content",
  },
  OUTDATED: {
    code: "OUTDATED_STACK",
    title: "Outdated design & stack",
    detail: "Table-based layout and legacy jQuery patterns indicate a design that predates modern standards.",
    severity: "MEDIUM",
    category: "ux",
  },
  NO_ECOMMERCE: {
    code: "NO_ECOMM",
    title: "No online ordering / checkout",
    detail: "No cart or checkout flow — the business cannot transact online despite clear demand.",
    severity: "HIGH",
    category: "content",
  },
  POOR_BRANDING: {
    code: "WEAK_BRAND",
    title: "Weak, inconsistent branding",
    detail: "Inconsistent typography, low-quality logo, and no cohesive color system erode perceived quality.",
    severity: "MEDIUM",
    category: "ux",
  },
};

import type { AuditFinding } from "@/lib/types";
