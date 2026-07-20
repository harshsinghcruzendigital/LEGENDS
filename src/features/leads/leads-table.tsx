"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { keepPreviousData } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LEADS } from "@/lib/mock/leads";
import { trpc } from "@/lib/trpc/client";
import { EMPTY_FILTERS, type LeadFilterState, type LeadSort, type LeadSortField } from "@/lib/leads-query";
import type { Lead } from "@/lib/types";
import { buildColumns, DEFAULT_HIDDEN } from "@/features/leads/columns";
import { LeadFilters } from "@/features/leads/lead-filters";
import { LeadDetail } from "@/features/leads/lead-detail";
import { BulkBar } from "@/features/leads/bulk-bar";

const PAGE_SIZE = 12;

export function LeadsTable() {
  const router = useRouter();
  const params = useSearchParams();

  const initial = React.useMemo<LeadFilterState>(() => {
    const f = { ...EMPTY_FILTERS };
    if (params.get("score") === "70") f.scorePreset = "60";
    if (params.get("status") === "broken") f.websiteStatuses = ["BROKEN", "NO_SSL"];
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filters, setFilters] = React.useState<LeadFilterState>(initial);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "leadScore", desc: true }]);
  const [page, setPage] = React.useState(0);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    Object.fromEntries(DEFAULT_HIDDEN.map((c) => [c, false])),
  );
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const openLead = React.useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  }, []);

  // Deep link ?lead=ld_0001 opens the slide-over.
  React.useEffect(() => {
    const id = params.get("lead");
    if (id) {
      const l = LEADS.find((x) => x.id === id);
      if (l) openLead(l);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sort = React.useMemo<LeadSort>(() => {
    const s = sorting[0];
    if (!s) return { field: "leadScore", dir: "desc" };
    return { field: s.id as LeadSortField, dir: s.desc ? "desc" : "asc" };
  }, [sorting]);

  // Server-side query (tRPC → repository → mock today, Postgres later).
  const listQuery = trpc.leads.list.useQuery(
    { filter: filters, sort, page, limit: PAGE_SIZE },
    { placeholderData: keepPreviousData },
  );

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const pageCount = listQuery.data?.pageCount ?? 1;
  const industries = listQuery.data?.facets.industries ?? [];

  // Reset to first page when the query shape changes.
  React.useEffect(() => setPage(0), [filters, sort]);

  const columns = React.useMemo(() => buildColumns(openLead), [openLead]);

  const table = useReactTable({
    data: items,
    columns,
    pageCount,
    state: { sorting, rowSelection, columnVisibility },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).length;
  const showSkeleton = listQuery.isLoading;
  const isRefetching = listQuery.isFetching && !listQuery.isLoading;

  return (
    <div className="space-y-4">
      <LeadFilters
        filters={filters}
        setFilters={setFilters}
        industries={industries}
        table={table}
        total={LEADS.length}
        filtered={total}
      />

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border">
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th key={header.id} style={{ width: header.getSize() }} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        {header.isPlaceholder ? null : canSort ? (
                          <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={header.column.getToggleSortingHandler()}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className={cn("transition-opacity", isRefetching && "opacity-60")}>
              {showSkeleton &&
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-border/60">
                    {table.getVisibleFlatColumns().map((col) => (
                      <td key={col.id} className="px-3 py-3"><Skeleton className="h-5 w-full" /></td>
                    ))}
                  </tr>
                ))}

              {!showSkeleton && items.length === 0 && (
                <tr>
                  <td colSpan={table.getAllColumns().length} className="py-16">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8" />
                      <p className="text-sm">No leads match your filters.</p>
                      <Button variant="outline" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</Button>
                    </div>
                  </td>
                </tr>
              )}

              {!showSkeleton &&
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openLead(row.original)}
                    className={cn("cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/40", row.getIsSelected() && "bg-primary/[0.06]")}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5 align-middle" style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            Page {page + 1} of {pageCount} · {total} results
            {isRefetching && <Loader2 className="h-3 w-3 animate-spin" />}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            {Array.from({ length: Math.min(5, pageCount) }).map((_, i) => {
              let p = i;
              if (pageCount > 5) p = Math.min(Math.max(0, page - 2), pageCount - 5) + i;
              return (
                <Button key={p} variant={p === page ? "default" : "ghost"} size="icon-sm" className="tabular-nums" onClick={() => setPage(p)}>
                  {p + 1}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </GlassCard>

      <BulkBar count={selectedCount} onClear={() => setRowSelection({})} />

      <LeadDetail
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o && params.get("lead")) router.replace("/leads");
        }}
      />
    </div>
  );
}
