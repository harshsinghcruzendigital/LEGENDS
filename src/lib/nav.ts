/**
 * Sidebar navigation model — mirrors docs/02-information-architecture.md §1-3.
 * `preview: true` marks modules whose full UX lands in Milestone 2 (honest,
 * explicitly-flagged placeholders per the implementation rules).
 */
import {
  LayoutDashboard,
  Radar,
  Database,
  Send,
  KanbanSquare,
  Workflow,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  preview?: boolean;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Lead Discovery", href: "/discovery", icon: Radar },
  { label: "Lead Database", href: "/leads", icon: Database },
  { label: "Campaigns", href: "/campaigns", icon: Send },
  { label: "CRM", href: "/crm", icon: KanbanSquare },
  { label: "Automation", href: "/automation", icon: Workflow },
  { label: "AI Insights", href: "/insights", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function findNav(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
}
