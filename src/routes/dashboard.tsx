import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppLayout, PageHeader } from "@/components/unveil/AppLayout";
import { StatCard } from "@/components/unveil/StatCard";
import { AlertCard } from "@/components/unveil/AlertCard";
import { ActivityTimeline } from "@/components/unveil/ActivityTimeline";
import { RiskBadge } from "@/components/unveil/RiskBadge";
import { StageChip } from "@/components/unveil/StageChip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileSearch, ShieldAlert, ClipboardList, CheckCircle2, ArrowUpRight, Plus, Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
  summaryStats,
  recentActivity,
  recentAlerts,
  applications,
} from "@/lib/sample-data";
import { useApp, matchesSearch } from "@/lib/app-context";
import { downloadFile, generateAuditReport } from "@/lib/export-report";
import { toast } from "sonner";
import { RouteGuard } from "@/components/unveil/RouteGuard";

export const Route = createFileRoute("/dashboard")({
  component: OverviewPage,
});

function OverviewPage() {
  const { search, openAlert, role } = useApp();
  const navigate = useNavigate();

  const filteredApps = useMemo(
    () => applications.filter((a) => matchesSearch(search, a.id, a.customer, a.product, a.officer, a.stage)),
    [search],
  );
  const filteredActivity = useMemo(
    () => recentActivity.filter((a) => matchesSearch(search, a.actor, a.action, a.ref)),
    [search],
  );
  const filteredAlerts = useMemo(
    () => recentAlerts.filter((a) => matchesSearch(search, a.id, a.title, a.source)),
    [search],
  );

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const currentApps = filteredApps.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const exportSummary = async () => {
    const content = await generateAuditReport({
      title: "Dashboard summary export",
      sections: [
        {
          heading: "KPIs",
          rows: [
            ["Documents Analyzed", String(summaryStats.documentsAnalyzed)],
            ["Suspicious Cases", String(summaryStats.suspiciousCases)],
            ["Pending Reviews", String(summaryStats.pendingReviews)],
            ["Approved Today", String(summaryStats.approvedToday)],
          ],
        },
        {
          heading: "Recent applications",
          rows: applications.map((a) => [a.id, `${a.customer} · ${a.product} · ${a.stage}`]),
        },
      ],
    });
    downloadFile(`unveil-summary-${Date.now()}.pdf`, content, "application/pdf");
    toast.success("Summary report downloaded");
  };

  return (
    <RouteGuard allowedRoles={["officer", "forensic analyst", "security"]}>
      <AppLayout>
        <PageHeader
          title={role === "forensic analyst" ? "forensic analysis Overview" : role === "security" ? "Security Overview" : "UNVEIL"}
          description="Intelligent banking security and application transparency"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={exportSummary}>
                <Download className="mr-2 h-4 w-4" /> Export report
              </Button>
              <Button size="sm" onClick={() => navigate({ to: "/review" })}>
                <Plus className="mr-2 h-4 w-4" /> New review
              </Button>
            </>
          }
        />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <StatCard label="Documents Analyzed" value={summaryStats.documentsAnalyzed.toLocaleString()} delta="+128 this week" tone="default" icon={FileSearch} />
        <StatCard label="Suspicious Cases" value={summaryStats.suspiciousCases} delta="+3 vs yesterday" tone="danger" icon={ShieldAlert} />
        <StatCard label="Pending Reviews" value={summaryStats.pendingReviews} delta="12 awaiting forensic analyst" tone="warning" icon={ClipboardList} />
        <StatCard label="Approved Today" value={summaryStats.approvedToday} delta="On track for SLA" tone="success" icon={CheckCircle2} />
      </div>

      <Card className="mt-8 glass-card relative overflow-hidden animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <CardContent className="p-8 sm:p-10 relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">Platform overview</p>
              <h2 className="mt-3 text-2xl font-light tracking-tight sm:text-3xl text-foreground">
                One source of truth for every case, document, and access event
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                UNVEIL continuously verifies submitted documents, cross-checks applicant data
                across statements and tax records, and monitors internal staff activity for anomalies.
                Officers and forensic analysts get a single, audit-ready view of every application — while
                customers see exactly where their file stands.
              </p>
            </div>
            <div className="grid w-full max-w-sm grid-cols-2 gap-3 text-sm">
              <Metric label="Avg. analysis time" value="2.4s" />
              <Metric label="Detection accuracy" value="98.7%" />
              <Metric label="SLA compliance" value="96%" />
              <Metric label="Active officers" value="42" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-4">
            <CardTitle className="text-lg font-light tracking-tight text-foreground">Activity timeline</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate({ to: "/reports" })}>
              View all <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {filteredActivity.length ? (
              <ActivityTimeline items={filteredActivity} />
            ) : (
              <EmptyHint label="No activity matches your search." />
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-4">
            <CardTitle className="text-lg font-light tracking-tight text-foreground">Recent alerts</CardTitle>
            <span className="rounded-full border border-destructive/25 bg-destructive/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-destructive-foreground">
              {filteredAlerts.length} shown
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredAlerts.length ? (
              filteredAlerts.map((a) => <AlertCard key={a.id} {...a} onClick={() => openAlert(a)} />)
            ) : (
              <EmptyHint label="No alerts match your search." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 glass-card animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-4">
          <CardTitle className="text-lg font-light tracking-tight text-foreground">Recent applications</CardTitle>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-black/15 px-3 py-1.5 rounded-full">{filteredApps.length} of {applications.length}</span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Application</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Officer</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentApps.map((a) => (
                <TableRow
                  key={a.id}
                  className="premium-table-row cursor-pointer transition-all duration-500 hover:bg-primary/[0.03]"
                  onClick={() => navigate({ to: "/status" })}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground/80">{a.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{a.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{a.product}</TableCell>
                  <TableCell className="tabular-nums">{a.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{a.officer}</TableCell>
                  <TableCell>
                    <StageChip stage={a.stage} />
                  </TableCell>
                  <TableCell className="text-right"><RiskBadge level={a.risk} /></TableCell>
                </TableRow>
              ))}
              {filteredApps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No applications match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * ITEMS_PER_PAGE, filteredApps.length)}</span> of <span className="font-medium text-foreground">{filteredApps.length}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
    </RouteGuard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/15 p-4 transition-all duration-500 hover:border-primary/15">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-extralight tabular-nums text-primary">{value}</p>
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return <p className="rounded-2xl border border-dashed border-white/[0.08] p-6 text-center text-xs text-muted-foreground tracking-wide">{label}</p>;
}
