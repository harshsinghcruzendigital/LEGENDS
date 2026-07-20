"use client";

import * as React from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Zap,
  ShieldCheck,
  Reply,
  GitBranch,
  Send,
  MailCheck,
  UserPlus,
  CheckSquare,
  Bell,
  Clock,
  Play,
  Pause,
  Plus,
  Terminal,
  X,
  Check,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { nodeTypes } from "@/features/automation/nodes";
import { NODE_PALETTE, SAMPLE_RUN_LOG, type Workflow, type WFKind, type WFNode } from "@/lib/mock/workflows";

const ICONS: Record<string, LucideIcon> = {
  Zap, ShieldCheck, Reply, GitBranch, Send, MailCheck, UserPlus, CheckSquare, Bell, Clock,
};

const KIND_COLOR: Record<WFKind, string> = {
  trigger: "hsl(246 89% 67%)",
  condition: "hsl(217 91% 60%)",
  action: "hsl(188 85% 53%)",
  wait: "hsl(38 92% 55%)",
};

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "hsl(var(--muted-foreground))" },
  style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
};

function Canvas({ workflow }: { workflow: Workflow }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<WFNode>(workflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(workflow.edges);
  const [status, setStatus] = React.useState(workflow.status);
  const [logOpen, setLogOpen] = React.useState(false);
  const [runLog, setRunLog] = React.useState<typeof SAMPLE_RUN_LOG>([]);
  const [running, setRunning] = React.useState(false);
  const counter = React.useRef(nodes.length);

  const onConnect = React.useCallback((c: Connection) => setEdges((eds) => addEdge({ ...c, ...defaultEdgeOptions }, eds)), [setEdges]);

  function addNode(kind: WFKind, label: string, detail: string, icon: string) {
    counter.current += 1;
    const id = `n_${counter.current}_${Date.now()}`;
    const idx = counter.current;
    const newNode: WFNode = {
      id,
      type: kind,
      position: { x: 520 + (idx % 3) * 40, y: 40 + idx * 30 },
      data: { kind, label, detail, icon },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added "${label}" node`);
  }

  function toggleStatus() {
    setStatus((s) => {
      const next = s === "ACTIVE" ? "PAUSED" : "ACTIVE";
      toast.success(next === "ACTIVE" ? "Workflow published & active" : "Workflow paused");
      return next;
    });
  }

  function testRun() {
    setLogOpen(true);
    setRunLog([]);
    setRunning(true);
    SAMPLE_RUN_LOG.forEach((line, i) => {
      setTimeout(() => {
        setRunLog((prev) => [...prev, line]);
        if (i === SAMPLE_RUN_LOG.length - 1) setRunning(false);
      }, (i + 1) * 600);
    });
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
        <Controls className="!rounded-lg !border !border-border !bg-card !shadow-md [&_button]:!border-border [&_button]:!bg-card [&_button]:!text-foreground" />
        <MiniMap
          pannable
          zoomable
          className="!rounded-lg !border !border-border !bg-card"
          nodeColor={(n) => KIND_COLOR[(n.data as { kind: WFKind }).kind] ?? "hsl(var(--muted))"}
          maskColor="hsl(var(--background) / 0.6)"
        />

        {/* Top bar */}
        <Panel position="top-center" className="!m-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/90 p-1.5 shadow-md backdrop-blur-xl">
            <span className={cn("ml-1.5 flex items-center gap-1.5 text-xs font-medium", status === "ACTIVE" ? "text-success" : status === "PAUSED" ? "text-warning" : "text-muted-foreground")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", status === "ACTIVE" ? "bg-success" : status === "PAUSED" ? "bg-warning" : "bg-muted-foreground")} />
              {status.toLowerCase()}
            </span>
            <div className="h-5 w-px bg-border" />
            <Button size="sm" variant="ghost" onClick={testRun} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />} Test run
            </Button>
            <Button size="sm" variant={status === "ACTIVE" ? "outline" : "default"} onClick={toggleStatus}>
              {status === "ACTIVE" ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Publish</>}
            </Button>
          </div>
        </Panel>

        {/* Palette */}
        <Panel position="top-left" className="!m-3">
          <div className="w-52 rounded-xl border border-border bg-card/90 p-2 shadow-md backdrop-blur-xl">
            <div className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold text-muted-foreground">
              <Plus className="h-3.5 w-3.5" /> Add node
            </div>
            <div className="max-h-[360px] space-y-1 overflow-y-auto scrollbar-thin">
              {NODE_PALETTE.map((p) => {
                const Icon = ICONS[p.icon] ?? Zap;
                return (
                  <button
                    key={p.label}
                    onClick={() => addNode(p.kind, p.label, p.detail, p.icon)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: `${KIND_COLOR[p.kind]}22`, color: KIND_COLOR[p.kind] }}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{p.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>

        {/* Run log */}
        {logOpen && (
          <Panel position="bottom-right" className="!m-3">
            <div className="w-80 rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold"><Terminal className="h-3.5 w-3.5" /> Run log</span>
                <button onClick={() => setLogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="max-h-52 space-y-1.5 overflow-y-auto scrollbar-thin p-3 font-mono text-[11px]">
                {runLog.length === 0 && <div className="text-muted-foreground">Running…</div>}
                {runLog.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                    <div>
                      <span className="text-muted-foreground">{l.at} </span>
                      <span className="text-accent">[{l.node}]</span> <span className="text-foreground/90">{l.msg}</span>
                    </div>
                  </div>
                ))}
                {running && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> processing…</div>}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas({ workflow }: { workflow: Workflow }) {
  return (
    <ReactFlowProvider>
      <Canvas workflow={workflow} />
    </ReactFlowProvider>
  );
}
