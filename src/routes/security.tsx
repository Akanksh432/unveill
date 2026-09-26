import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense, useState } from "react";
import { AppLayout, PageHeader } from "@/components/unveil/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { employees, securityAlerts, alertsByDay } from "@/lib/sample-data";
import { useApp, matchesSearch } from "@/lib/app-context";
import { downloadFile, generateAuditReport } from "@/lib/export-report";
import { toast } from "sonner";

const SecurityBarChart = React.lazy(
  () => import("@/components/unveil/SecurityBarChart"),
);

import { RouteGuard } from "@/components/unveil/RouteGuard";

export const Route = createFileRoute("/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const { search, openAlert } = useApp();
  const [dept, setDept] = useState("all");
  const [sev, setSev] = useState("all");

  const filtered = securityAlerts.filter((a) => {
    if (dept !== "all" && a.department !== dept) return false;
    if (sev !== "all" && a.severity.toLowerCase() !== sev) return false;
    return matchesSearch(search, a.id, a.employee, a.department, a.event, a.severity);
  });

  const exportAudit = async () => {
    const content = await generateAuditReport({
      title: "Security audit log",
      sections: [
        {
          heading: "Alerts",
          rows: securityAlerts.map((a) => [
            a.id,
            `${a.time} · ${a.employee} · ${a.event} · ${a.severity} (anomaly ${a.anomaly})`,
          ]),
        },
        {
          heading: "Employees",
          rows: employees.map((e) => [e.id, `${e.name} · ${e.role} · anomaly ${e.anomaly}`]),
        },
      ],
    });
    downloadFile(`security-audit-${Date.now()}.pdf`, content, "application/pdf");
    toast.success("Audit log exported");
  };

  return (
    <RouteGuard allowedRoles={["security", "forensic analyst"]}>
      <AppLayout>
      <PageHeader
        title="Security & Admin"
        description="Monitor employee activity, anomalous sessions, and platform-wide alerts."
        actions={<Button size="sm" variant="outline" onClick={exportAudit}>Export audit log</Button>}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        {employees.map((e) => (
          <Card key={e.id} className="glass-card transition-all duration-500 hover:scale-[1.01]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{e.id}</p>
                  <p className="mt-1 text-base font-light text-foreground">{e.name}</p>
                  <p className="text-xs font-medium text-muted-foreground">{e.role}</p>
                </div>
                <AnomalyBadge score={e.anomaly} />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Actions today</span>
                <span className="text-lg font-semibold tabular-nums">{e.actionsToday}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="border-b border-white/[0.06] pb-4">
            <CardTitle className="text-lg font-light tracking-tight text-foreground">Alerts by day</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chart…</div>}>
              <SecurityBarChart data={alertsByDay} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="border-b border-white/[0.06] pb-4">
            <CardTitle className="text-lg font-light tracking-tight text-foreground">Suspicious sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {securityAlerts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => openAlert(a)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-black/10 p-4 text-left transition-all duration-500 hover:bg-primary/[0.04] hover:border-primary/15"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{a.employee}</p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">{a.event}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-medium text-muted-foreground/70">{a.time.slice(-5)}</span>
                  <SeverityPill level={a.severity} />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 glass-card animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4">
          <CardTitle className="text-lg font-light tracking-tight text-foreground">Alerts</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Input type="date" className="h-9 w-[150px] bg-black/20 border-border/40" defaultValue="2025-05-15" />
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="forensic analysis">forensic analysis</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sev} onValueChange={setSev}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="text-right">Anomaly</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow
                  key={a.id}
                  className="premium-table-row cursor-pointer transition-all duration-500 hover:bg-primary/[0.03]"
                  onClick={() => openAlert(a)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground/80">{a.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground/80">{a.time}</TableCell>
                  <TableCell className="font-medium text-foreground">{a.employee}</TableCell>
                  <TableCell className="text-muted-foreground">{a.department}</TableCell>
                  <TableCell className="text-foreground/80">{a.event}</TableCell>
                  <TableCell><SeverityPill level={a.severity} /></TableCell>
                  <TableCell className="text-right"><AnomalyBadge score={a.anomaly} /></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No alerts match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
    </RouteGuard>
  );
}

function AnomalyBadge({ score }: { score: number }) {
  const tone =
    score >= 70 ? "bg-destructive/15 text-destructive border-destructive/40 shadow-[0_0_10px_rgba(255,95,86,0.1)]"
    : score >= 40 ? "bg-warning/15 text-warning border-warning/30 shadow-[0_0_10px_rgba(255,189,46,0.1)]"
    : "bg-success/15 text-success border-success/30 shadow-[0_0_10px_rgba(39,201,63,0.1)]";
  return (
    <span className={cn("inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums", tone)}>
      {score}
    </span>
  );
}

function SeverityPill({ level }: { level: "Low" | "Medium" | "High" }) {
  const tone =
    level === "High" ? "bg-destructive/15 text-destructive border-destructive/40 shadow-[0_0_10px_rgba(255,95,86,0.1)]"
    : level === "Medium" ? "bg-warning/15 text-warning border-warning/30 shadow-[0_0_10px_rgba(255,189,46,0.1)]"
    : "bg-black/30 text-muted-foreground/80 border-border/40";
  return <span className={cn("inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]", tone)}>{level}</span>;
}
