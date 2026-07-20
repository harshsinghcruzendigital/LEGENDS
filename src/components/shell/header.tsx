"use client";

import { Menu, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Notifications } from "@/components/shell/notifications";
import { UserMenu } from "@/components/shell/user-menu";
import { OPEN_COMMAND_EVENT } from "@/components/shell/command-palette";
import type { SessionUser } from "@/lib/types";

export function Header({ user, onOpenMobileNav }: { user: SessionUser; onOpenMobileNav: () => void }) {
  const openCommand = () => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT));

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Global search → command palette */}
      <button
        onClick={openCommand}
        className="group flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/60"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search leads, companies, actions…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button size="sm" className="mr-1 hidden sm:inline-flex" onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT))}>
          <Plus className="h-4 w-4" /> New Discovery
        </Button>
        <ThemeToggle />
        <Notifications />
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
