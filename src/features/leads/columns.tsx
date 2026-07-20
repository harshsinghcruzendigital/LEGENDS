"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { MoreHorizontal, ExternalLink, Eye, UserPlus, Send, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { ScoreBar } from "@/components/ui/score-ring";
import { WebsiteStatusBadge, StageBadge } from "@/components/ui/domain-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OPPORTUNITY_LABELS } from "@/lib/mock/pools";
import { formatCompact, formatCurrency, formatDate, initials } from "@/lib/format";
import type { Lead } from "@/lib/types";

/**
 * TanStack column definitions for the Lead Database (docs/02 §3.9, docs/04 grid
 * projection). `onOpen` opens the slide-over detail (docs/06 §5).
 */
export function buildColumns(onOpen: (lead: Lead) => void): ColumnDef<Lead>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 36,
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => {
        const l = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-secondary">
              <Image src={l.logoUrl} alt="" fill sizes="32px" className="object-cover" unoptimized />
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{l.company}</div>
              <div className="truncate text-xs text-muted-foreground">{l.domain}</div>
            </div>
          </div>
        );
      },
      size: 240,
    },
    {
      accessorKey: "websiteStatus",
      header: "Website",
      cell: ({ row }) => <WebsiteStatusBadge status={row.original.websiteStatus} />,
      enableSorting: false,
      size: 120,
    },
    {
      accessorKey: "leadScore",
      header: "Lead Score",
      cell: ({ row }) => <ScoreRing score={row.original.leadScore} size={38} strokeWidth={4} />,
      size: 100,
    },
    {
      accessorKey: "websiteScore",
      header: "Website Score",
      cell: ({ row }) => (
        <div className="w-24">
          <ScoreBar score={row.original.websiteScore} label="" />
        </div>
      ),
      size: 130,
    },
    {
      accessorKey: "opportunityType",
      header: "Opportunity",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.opportunityType.slice(0, 2).map((o) => (
            <Badge key={o} variant="accent" className="text-[10px]">
              {OPPORTUNITY_LABELS[o]}
            </Badge>
          ))}
          {row.original.opportunityType.length > 2 && (
            <Badge variant="muted" className="text-[10px]">+{row.original.opportunityType.length - 2}</Badge>
          )}
        </div>
      ),
      enableSorting: false,
      size: 200,
    },
    {
      id: "location",
      accessorFn: (l) => `${l.city}, ${l.country}`,
      header: "Location",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.city}</div>
          <div className="text-xs text-muted-foreground">{row.original.country}</div>
        </div>
      ),
      enableSorting: false,
      size: 140,
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.industry}</span>,
      enableSorting: false,
      size: 150,
    },
    {
      accessorKey: "employees",
      header: "Employees",
      cell: ({ row }) => <span className="tabular-nums">{formatCompact(row.original.employees)}</span>,
      size: 100,
    },
    {
      accessorKey: "revenueMinor",
      header: "Revenue",
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatCurrency(row.original.revenueMinor)}</span>,
      size: 110,
    },
    {
      accessorKey: "cms",
      header: "CMS",
      cell: ({ row }) => <Badge variant="secondary" className="font-mono text-[10px]">{row.original.cms}</Badge>,
      enableSorting: false,
      size: 110,
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => <StageBadge stage={row.original.stage} />,
      enableSorting: false,
      size: 120,
    },
    {
      accessorKey: "assignedTo",
      header: "Assigned",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
              {initials(row.original.assignedTo)}
            </span>
            <span className="text-xs text-muted-foreground">{row.original.assignedTo.split(" ")[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/60">Unassigned</span>
        ),
      size: 130,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
      size: 110,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const l = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen(l)}><Eye /> View details</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={l.website} target="_blank" rel="noreferrer"><ExternalLink /> Visit website</a>
              </DropdownMenuItem>
              <DropdownMenuItem><UserPlus /> Assign</DropdownMenuItem>
              <DropdownMenuItem><Send /> Add to sequence</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 48,
    },
  ];
}

export const DEFAULT_HIDDEN = ["industry", "employees", "revenueMinor", "cms"];
