/** Workflow definitions (docs/12 workflow engine). Graphs use React Flow node/edge shape. */
import type { Node, Edge } from "@xyflow/react";

export type WFKind = "trigger" | "condition" | "action" | "wait";
export type WFStatus = "ACTIVE" | "PAUSED" | "DRAFT";

export interface WFData extends Record<string, unknown> {
  kind: WFKind;
  label: string;
  detail?: string;
  icon?: string;
}

export type WFNode = Node<WFData>;

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WFStatus;
  runs: number;
  successRate: number;
  updatedAt: string;
  nodes: WFNode[];
  edges: Edge[];
}

/** Palette items the builder can drop onto the canvas. */
export const NODE_PALETTE: { kind: WFKind; label: string; detail: string; icon: string }[] = [
  { kind: "trigger", label: "Lead scored", detail: "When a lead's score changes", icon: "Zap" },
  { kind: "trigger", label: "Audit completed", detail: "When a website audit finishes", icon: "ShieldCheck" },
  { kind: "trigger", label: "Email replied", detail: "When a prospect replies", icon: "Reply" },
  { kind: "condition", label: "If / branch", detail: "Branch on a lead field", icon: "GitBranch" },
  { kind: "action", label: "Enroll in campaign", detail: "Add lead to a sequence", icon: "Send" },
  { kind: "action", label: "Verify email", detail: "Validate the contact email", icon: "MailCheck" },
  { kind: "action", label: "Assign to rep", detail: "Route to a team member", icon: "UserPlus" },
  { kind: "action", label: "Create task", detail: "Add a CRM follow-up task", icon: "CheckSquare" },
  { kind: "action", label: "Notify Slack", detail: "Post to a channel", icon: "Bell" },
  { kind: "wait", label: "Wait", detail: "Delay before the next step", icon: "Clock" },
];

const BASE = Date.parse("2026-07-18T12:00:00Z");
const ago = (h: number) => new Date(BASE - h * 3600000).toISOString();

function n(id: string, kind: WFKind, x: number, y: number, label: string, detail: string, icon: string): WFNode {
  return { id, type: kind, position: { x, y }, data: { kind, label, detail, icon } };
}

/** The canonical recipe from docs/12 §6. */
const brokenSiteNodes: WFNode[] = [
  n("t1", "trigger", 240, 0, "Lead scored", "websiteScore ≤ 30", "Zap"),
  n("c1", "condition", 240, 130, "Has verified email?", "primaryContact.emailStatus = VALID", "GitBranch"),
  n("a1", "action", 20, 280, "Verify email", "Queue email verification", "MailCheck"),
  n("a2", "action", 440, 280, "Enroll in campaign", "'Broken Site Teardown'", "Send"),
  n("w1", "wait", 440, 410, "Wait 3 days", "Then check for a reply", "Clock"),
  n("c2", "condition", 440, 540, "Replied?", "enrollment.replied = true", "GitBranch"),
  n("a3", "action", 240, 690, "Notify Slack + task", "#sales · create follow-up", "Bell"),
  n("a4", "action", 660, 690, "Send follow-up", "Sequence step 2", "Send"),
];
const brokenSiteEdges: Edge[] = [
  { id: "e1", source: "t1", target: "c1", animated: true },
  { id: "e2", source: "c1", sourceHandle: "false", target: "a1", label: "no" },
  { id: "e3", source: "c1", sourceHandle: "true", target: "a2", label: "yes" },
  { id: "e4", source: "a1", target: "a2" },
  { id: "e5", source: "a2", target: "w1", animated: true },
  { id: "e6", source: "w1", target: "c2" },
  { id: "e7", source: "c2", sourceHandle: "true", target: "a3", label: "yes" },
  { id: "e8", source: "c2", sourceHandle: "false", target: "a4", label: "no" },
];

const autoAssignNodes: WFNode[] = [
  n("t1", "trigger", 200, 0, "Lead scored", "leadScore ≥ 80", "Zap"),
  n("c1", "condition", 200, 130, "US-based?", "country = United States", "GitBranch"),
  n("a1", "action", 200, 290, "Assign to rep", "Round-robin sales team", "UserPlus"),
  n("a2", "action", 200, 420, "Notify Slack", "#hot-leads", "Bell"),
];
const autoAssignEdges: Edge[] = [
  { id: "e1", source: "t1", target: "c1", animated: true },
  { id: "e2", source: "c1", sourceHandle: "true", target: "a1", label: "yes" },
  { id: "e3", source: "a1", target: "a2", animated: true },
];

const followupNodes: WFNode[] = [
  n("t1", "trigger", 200, 0, "Email replied", "Any active campaign", "Reply"),
  n("a1", "action", 200, 150, "Create task", "'Respond within 1h'", "CheckSquare"),
  n("a2", "action", 200, 290, "Notify Slack", "#replies", "Bell"),
];
const followupEdges: Edge[] = [
  { id: "e1", source: "t1", target: "a1", animated: true },
  { id: "e2", source: "a1", target: "a2" },
];

export const WORKFLOWS: Workflow[] = [
  {
    id: "wf_001",
    name: "Broken Site → Outreach",
    description: "The canonical recipe: score → verify → sequence → wait → notify or follow up.",
    status: "ACTIVE",
    runs: 342,
    successRate: 96,
    updatedAt: ago(5),
    nodes: brokenSiteNodes,
    edges: brokenSiteEdges,
  },
  {
    id: "wf_002",
    name: "High-Score Auto-Assign",
    description: "Route hot US leads to a rep and ping the team instantly.",
    status: "ACTIVE",
    runs: 128,
    successRate: 99,
    updatedAt: ago(28),
    nodes: autoAssignNodes,
    edges: autoAssignEdges,
  },
  {
    id: "wf_003",
    name: "Reply → Fast Follow-up",
    description: "Never let a reply go cold — task + Slack within seconds.",
    status: "PAUSED",
    runs: 87,
    successRate: 94,
    updatedAt: ago(72),
    nodes: followupNodes,
    edges: followupEdges,
  },
  {
    id: "wf_004",
    name: "New Qualified → Slack Alert",
    description: "Draft workflow — ping a channel when a new lead crosses score 70.",
    status: "DRAFT",
    runs: 0,
    successRate: 0,
    updatedAt: ago(120),
    nodes: [n("t1", "trigger", 200, 0, "Lead scored", "leadScore ≥ 70", "Zap"), n("a1", "action", 200, 150, "Notify Slack", "#new-qualified", "Bell")],
    edges: [{ id: "e1", source: "t1", target: "a1", animated: true }],
  },
];

export function getWorkflow(id: string): Workflow | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}

/** Mock run-log lines for the canonical workflow (docs/12 §3 visible trace). */
export const SAMPLE_RUN_LOG: { at: string; node: string; msg: string; ok: boolean }[] = [
  { at: "12:04:01", node: "Trigger", msg: "Lead 'Cedar Interiors' scored 22 — matched websiteScore ≤ 30", ok: true },
  { at: "12:04:01", node: "Condition", msg: "Has verified email? → yes (owner@cedarinteriors.com)", ok: true },
  { at: "12:04:02", node: "Enroll", msg: "Enrolled in 'Broken Site Teardown'", ok: true },
  { at: "12:04:02", node: "Wait", msg: "Waiting 3 days for a reply…", ok: true },
];
