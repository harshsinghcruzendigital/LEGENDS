"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Radar } from "lucide-react";
import { Sidebar } from "@/components/shell/sidebar";
import { Header } from "@/components/shell/header";
import { CommandPalette } from "@/components/shell/command-palette";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

const COLLAPSE_KEY = "leadgen:sidebar-collapsed";

/**
 * Client shell — owns sidebar collapse state, mobile nav, and hosts the command
 * palette. The server layout ((app)/layout.tsx) resolves the session and passes
 * `user` in. This is the persistent chrome for every authenticated route.
 */
export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);
  React.useEffect(() => setMobileOpen(false), [pathname]);

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      {/* Mobile nav drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-16 items-center gap-2.5 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Radar className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold">Lead Gen Engine</span>
          </div>
          <nav className="space-y-1 px-3 py-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/60",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" /> {item.label}
                  {item.preview && <span className="ml-auto text-[10px] uppercase text-accent">M2</span>}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
