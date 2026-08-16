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
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox, Loader2, Bookmark, Download, Radar, Check, Trash2, Edit, Plus, Settings2 } from "lucide-react";
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
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 12;

export function LeadsTable() {
  const router = useRouter();
  const params = useSearchParams();
  const utils = trpc.useUtils();

  const initial = React.useMemo<LeadFilterState>(() => {
    const f = { ...EMPTY_FILTERS };
    if (params.get("score") === "70") f.scorePreset = "60";
    if (params.get("status") === "broken") {
      f.websiteStatuses = ["OFFLINE", "DNS_ERROR", "SSL_ERROR", "REDIRECT_ERROR", "TIMEOUT"];
    }
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

  // Saved Views hooks
  const { data: savedViews, refetch: refetchViews } = trpc.savedViews.list.useQuery();
  const createViewM = trpc.savedViews.create.useMutation({ onSuccess: () => { refetchViews(); } });
  const updateViewM = trpc.savedViews.update.useMutation({ onSuccess: () => { refetchViews(); } });
  const deleteViewM = trpc.savedViews.delete.useMutation({ onSuccess: () => { refetchViews(); } });

  // Dialog and input states
  const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = React.useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [newViewName, setNewViewName] = React.useState("");
  const [newViewDefault, setNewViewDefault] = React.useState(false);
  const [activeViewId, setActiveViewId] = React.useState<string | null>(null);
  const [renamingViewId, setRenamingViewId] = React.useState<string | null>(null);
  const [renamingViewName, setRenamingViewName] = React.useState("");
  const [exportScope, setExportScope] = React.useState<"selected" | "page" | "filtered" | "all">("filtered");
  const [isExporting, setIsExporting] = React.useState(false);

  // Apply default view on load (if database or storage has one)
  React.useEffect(() => {
    if (savedViews && savedViews.length > 0) {
      const def = savedViews.find((v) => v.isDefault);
      if (def) {
        applySavedView(def);
      }
    }
  }, [savedViews]);

  const applySavedView = (view: any) => {
    setFilters(view.filters);
    if (view.sorting) setSorting(view.sorting);
    if (view.columns) {
      const visibleCols = view.columns as string[];
      const allCols = ["company", "websiteStatus", "leadScore", "websiteScore", "opportunityType", "location", "stage", "assignedTo", "createdAt", "industry", "employees", "revenueMinor", "cms"];
      const nextVis: VisibilityState = {};
      allCols.forEach((colId) => {
        nextVis[colId] = visibleCols.includes(colId);
      });
      setColumnVisibility(nextVis);
    }
    setActiveViewId(view.id);
    toast.success(`Applied view "${view.name}"`);
  };

  const handleCreateView = async () => {
    if (!newViewName.trim()) {
      toast.error("Please enter a name for the saved view.");
      return;
    }
    const visibleCols = table.getVisibleFlatColumns().map((c) => c.id);
    try {
      const created = await createViewM.mutateAsync({
        name: newViewName.trim(),
        filters,
        columns: visibleCols,
        sorting,
        isDefault: newViewDefault,
      });
      setIsSaveModalOpen(false);
      setNewViewName("");
      setNewViewDefault(false);
      setActiveViewId(created.id);
      toast.success(`Saved view "${created.name}" created!`);
    } catch {
      toast.error("Failed to save view.");
    }
  };

  const handleDeleteView = async (id: string, name: string) => {
    try {
      await deleteViewM.mutateAsync({ id });
      if (activeViewId === id) setActiveViewId(null);
      toast.success(`Deleted view "${name}"`);
    } catch {
      toast.error("Failed to delete view.");
    }
  };

  const handleRenameView = async () => {
    if (!renamingViewId || !renamingViewName.trim()) return;
    try {
      await updateViewM.mutateAsync({ id: renamingViewId, name: renamingViewName.trim() });
      setRenamingViewId(null);
      setRenamingViewName("");
      toast.success("View renamed successfully");
    } catch {
      toast.error("Failed to rename view.");
    }
  };

  const handleSetDefaultView = async (id: string, name: string, isDefault: boolean) => {
    try {
      await updateViewM.mutateAsync({ id, isDefault });
      toast.success(`Updated default view setting for "${name}"`);
    } catch {
      toast.error("Failed to update default view.");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let leadsToExport: Lead[] = [];
      
      if (exportScope === "selected") {
        leadsToExport = table.getSelectedRowModel().rows.map((r) => r.original);
        if (leadsToExport.length === 0) {
          toast.error("No rows selected for export.");
          setIsExporting(false);
          return;
        }
      } else if (exportScope === "page") {
        leadsToExport = items;
      } else if (exportScope === "filtered") {
        const fullList = await utils.client.leads.list.query({
          filter: filters,
          sort,
          page: 0,
          limit: 100000,
        });
        leadsToExport = fullList.items;
      } else if (exportScope === "all") {
        const fullList = await utils.client.leads.list.query({
          filter: EMPTY_FILTERS,
          sort,
          page: 0,
          limit: 100000,
        });
        leadsToExport = fullList.items;
      }
      
      exportToCsv(leadsToExport, `leads-export-${new Date().toISOString().split("T")[0]}.csv`);
      setIsExporting(false);
      setIsExportModalOpen(false);
      toast.success(`Exported ${leadsToExport.length} leads successfully!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export leads.");
      setIsExporting(false);
    }
  };

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
  const countries = listQuery.data?.facets.countries ?? [];

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
    <div className="space-y-6">
      <PageHeader
        title="Lead Database"
        description="Every discovered, audited, and scored opportunity — searchable and filterable."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4" /> Saved views
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card/90 backdrop-blur border border-border/80">
                <DropdownMenuItem onClick={() => { setNewViewName(""); setNewViewDefault(false); setIsSaveModalOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Save current view
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsManageModalOpen(true)}>
                  <Settings2 className="mr-2 h-4 w-4" /> Manage saved views
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {savedViews && savedViews.length > 0 ? (
                  savedViews.map((v) => (
                    <DropdownMenuItem key={v.id} onClick={() => applySavedView(v)} className="flex items-center justify-between">
                      <span className="truncate">{v.name}</span>
                      {v.id === activeViewId && <Check className="h-4 w-4 text-primary shrink-0" />}
                      {v.isDefault && <span className="text-[9px] bg-secondary text-secondary-foreground rounded px-1 shrink-0 ml-1">Default</span>}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No saved views yet</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={() => setIsExportModalOpen(true)}>
              <Download className="h-4 w-4" /> Export
            </Button>
            
            <Button size="sm" onClick={() => window.dispatchEvent(new Event("leadgen:open-command"))}>
              <Radar className="h-4 w-4" /> New Discovery
            </Button>
          </>
        }
      />

      <LeadFilters
        filters={filters}
        setFilters={setFilters}
        industries={industries}
        countries={countries}
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

      {/* Dialog for Saving Current View */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 border border-border/80 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Save your current search queries, active filters, columns layout, and sorting rules as a reusable view.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="view-name" className="text-foreground">View Name</Label>
              <Input
                id="view-name"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="e.g. Broken Websites in US"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="view-default" className="flex flex-col gap-0.5 text-foreground cursor-pointer">
                <span>Set as default view</span>
                <span className="font-normal text-xs text-muted-foreground">This view will load automatically when you open the database</span>
              </Label>
              <Switch id="view-default" checked={newViewDefault} onCheckedChange={setNewViewDefault} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSaveModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateView} disabled={createViewM.isPending}>Save view</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Managing Saved Views */}
      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card/95 border border-border/80 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Manage Saved Views</DialogTitle>
            <DialogDescription>
              Rename, delete, or change default preferences for your saved lead views.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-3 py-2 pr-1">
            {savedViews && savedViews.length > 0 ? (
              savedViews.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/20 p-3">
                  <div className="min-w-0 flex-1">
                    {renamingViewId === v.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={renamingViewName}
                          onChange={(e) => setRenamingViewName(e.target.value)}
                          className="h-8 py-1"
                        />
                        <Button size="sm" className="h-8 px-2" onClick={handleRenameView} disabled={updateViewM.isPending}><Check className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setRenamingViewId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate text-foreground">{v.name}</span>
                        {v.isDefault && <Badge variant="secondary" className="text-[10px] shrink-0">Default</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {renamingViewId !== v.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Rename view"
                          onClick={() => { setRenamingViewId(v.id); setRenamingViewName(v.name); }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={v.isDefault ? "Current Default" : "Set as Default"}
                          disabled={v.isDefault || updateViewM.isPending}
                          onClick={() => handleSetDefaultView(v.id, v.name, true)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10"
                          title="Delete view"
                          disabled={deleteViewM.isPending}
                          onClick={() => handleDeleteView(v.id, v.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">No saved views yet. Create one by clicking 'Save current view'.</div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsManageModalOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Exporting Leads */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 border border-border/80 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Export Leads to CSV</DialogTitle>
            <DialogDescription>
              Export your lead list database into a UTF-8 compatible CSV spreadsheet format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-foreground">Select Export Range</Label>
              <div className="grid gap-2">
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/10 p-3 hover:bg-secondary/40 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">Selected Leads Only</span>
                    <span className="text-xs text-muted-foreground">Export only checked leads ({selectedCount} selected)</span>
                  </div>
                  <input
                    type="radio"
                    name="export-scope"
                    value="selected"
                    disabled={selectedCount === 0}
                    checked={exportScope === "selected"}
                    onChange={() => setExportScope("selected")}
                    className="accent-primary h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/10 p-3 hover:bg-secondary/40 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">Current Page Only</span>
                    <span className="text-xs text-muted-foreground">Export only leads displayed on this page ({items.length} leads)</span>
                  </div>
                  <input
                    type="radio"
                    name="export-scope"
                    value="page"
                    checked={exportScope === "page"}
                    onChange={() => setExportScope("page")}
                    className="accent-primary h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/10 p-3 hover:bg-secondary/40 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">All Filtered Leads</span>
                    <span className="text-xs text-muted-foreground">Export all leads matching active search/filters ({total} leads)</span>
                  </div>
                  <input
                    type="radio"
                    name="export-scope"
                    value="filtered"
                    checked={exportScope === "filtered"}
                    onChange={() => setExportScope("filtered")}
                    className="accent-primary h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/10 p-3 hover:bg-secondary/40 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">Entire Database</span>
                    <span className="text-xs text-muted-foreground">Export all leads in the database without filters ({LEADS.length} leads)</span>
                  </div>
                  <input
                    type="radio"
                    name="export-scope"
                    value="all"
                    checked={exportScope === "all"}
                    onChange={() => setExportScope("all")}
                    className="accent-primary h-4 w-4"
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Export CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function exportToCsv(leads: Lead[], filename: string) {
  const headers = [
    "Company",
    "Website",
    "Website Status",
    "Lead Score",
    "Website Score",
    "Opportunity",
    "Location",
    "Stage",
    "Assigned",
    "Created Date",
    "Industry",
    "Revenue",
    "Employees"
  ];
  
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leads.map(l => [
    l.company,
    l.website,
    l.websiteStatus,
    l.leadScore,
    l.websiteScore,
    l.opportunityType.join("; "),
    `${l.city}, ${l.country}`,
    l.stage,
    l.assignedTo || "Unassigned",
    new Date(l.createdAt).toLocaleDateString(),
    l.industry,
    Number(l.revenueMinor) / 100,
    l.employees
  ]);

  const csvContent = [headers.map(escapeCsv).join(",")]
    .concat(rows.map(row => row.map(escapeCsv).join(",")))
    .join("\r\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
