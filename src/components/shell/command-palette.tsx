"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/lib/nav";
import { LEADS } from "@/lib/mock/leads";
import { Sparkles, Radar, Database, MailCheck, ArrowRight } from "lucide-react";
import { initials } from "@/lib/format";

export const OPEN_COMMAND_EVENT = "leadgen:open-command";

/** ⌘K command palette — jump-to + AI-style actions (docs/02 §1). */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_COMMAND_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_COMMAND_EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const topLeads = LEADS.slice(0, 6);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search leads, run discovery, or ask AI…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="AI Actions">
          <CommandItem onSelect={() => go("/discovery")}>
            <Sparkles /> Ask AI to find broken Shopify stores
            <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-50" />
          </CommandItem>
          <CommandItem onSelect={() => go("/discovery")}>
            <Radar /> Run a new discovery
          </CommandItem>
          <CommandItem onSelect={() => go("/leads?score=70")}>
            <Database /> Show qualified leads (score ≥ 70)
          </CommandItem>
          <CommandItem onSelect={() => go("/leads?status=broken")}>
            <MailCheck /> Show broken-website segment
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <Icon /> {item.label}
                {item.preview && <span className="ml-auto text-[10px] uppercase text-accent">M2</span>}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="Recent Leads">
          {topLeads.map((l) => (
            <CommandItem key={l.id} value={`${l.company} ${l.domain}`} onSelect={() => go(`/leads?lead=${l.id}`)}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-[9px] font-semibold text-secondary-foreground">
                {initials(l.company)}
              </span>
              {l.company}
              <span className="ml-auto text-xs text-muted-foreground">{l.domain}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
