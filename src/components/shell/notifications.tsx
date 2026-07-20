"use client";

import * as React from "react";
import { Bell, Radar, MessageSquare, TrendingUp, CheckSquare, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NOTIFICATIONS } from "@/lib/mock/notifications";
import type { Notification } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<Notification["kind"], typeof Bell> = {
  discovery: Radar,
  reply: MessageSquare,
  score: TrendingUp,
  task: CheckSquare,
  system: Info,
};

export function Notifications() {
  const [items, setItems] = React.useState<Notification[]>(NOTIFICATIONS);
  const [now, setNow] = React.useState<number>(() => Date.parse("2026-07-18T12:00:00Z"));
  React.useEffect(() => setNow(Date.now()), []);
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">{unread} new</span>}
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
            <Check className="h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
        <Separator />
        <ScrollArea className="max-h-[380px]">
          <div className="p-1.5">
            {items.map((n) => {
              const Icon = ICONS[n.kind];
              return (
                <button
                  key={n.id}
                  onClick={() => setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                  className={cn(
                    "flex w-full gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-secondary/60",
                    !n.read && "bg-primary/[0.04]",
                  )}
                >
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", !n.read ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <span className="mt-1 block text-[11px] text-muted-foreground/70">{relativeTime(n.at, now)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
            View all activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
