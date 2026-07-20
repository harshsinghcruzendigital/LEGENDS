"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send, UserPlus, Tag, MailCheck, Download, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Persistent bulk-action bar (docs/02 §4 — identical grammar across surfaces). */
export function BulkBar({ count, onClear }: { count: number; onClear: () => void }) {
  const act = (label: string) => () => toast.success(`${label} · ${count} lead${count > 1 ? "s" : ""}`);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-40 flex items-center gap-1 rounded-xl border border-border bg-popover/90 p-1.5 shadow-xl backdrop-blur-xl"
        >
          <span className="flex items-center gap-2 rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary">
            <span className="tabular-nums">{count}</span> selected
          </span>
          <div className="mx-1 h-6 w-px bg-border" />
          <Button variant="ghost" size="sm" onClick={act("Added to sequence")}><Send className="h-4 w-4" /> Sequence</Button>
          <Button variant="ghost" size="sm" onClick={act("Assigned")}><UserPlus className="h-4 w-4" /> Assign</Button>
          <Button variant="ghost" size="sm" onClick={act("Tagged")}><Tag className="h-4 w-4" /> Tag</Button>
          <Button variant="ghost" size="sm" onClick={act("Verifying emails")}><MailCheck className="h-4 w-4" /> Verify</Button>
          <Button variant="ghost" size="sm" onClick={act("Exported")}><Download className="h-4 w-4" /> Export</Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={act("Deleted")}><Trash2 className="h-4 w-4" /></Button>
          <div className="mx-1 h-6 w-px bg-border" />
          <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Clear selection"><X className="h-4 w-4" /></Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
