/** Mock notifications for the header panel (docs/02 §1 top bar). */
import type { Notification } from "@/lib/types";

const BASE = Date.parse("2026-07-18T12:00:00Z");
const ago = (mins: number) => new Date(BASE - mins * 60000).toISOString();

export const NOTIFICATIONS: Notification[] = [
  {
    id: "nt1",
    kind: "discovery",
    title: "Discovery run complete",
    body: "42 new leads found for “Shopify · Home & Furniture · US”. 18 qualified.",
    at: ago(6),
    read: false,
  },
  {
    id: "nt2",
    kind: "reply",
    title: "New reply from Cedar Interiors",
    body: "“This is really helpful — can you send the full audit?”",
    at: ago(48),
    read: false,
  },
  {
    id: "nt3",
    kind: "score",
    title: "12 leads crossed score 80",
    body: "High-intent opportunities are ready to sequence.",
    at: ago(140),
    read: false,
  },
  {
    id: "nt4",
    kind: "task",
    title: "Task due today",
    body: "Follow up with Nova Goods — proposal sent 3 days ago.",
    at: ago(300),
    read: true,
  },
  {
    id: "nt5",
    kind: "system",
    title: "Weekly summary ready",
    body: "You discovered 214 leads and verified 388 emails this week.",
    at: ago(1440),
    read: true,
  },
];
