import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppLayout, PageHeader } from "@/components/unveil/AppLayout";
import { StatCard } from "@/components/unveil/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileSearch, ShieldAlert, ClipboardList, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { useApp, matchesSearch } from "@/lib/app-context";
import { RouteGuard } from "@/components/unveil/RouteGuard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

// New Mock Data for Phase 0 & 3
const recentScans = [
  { id: "UNV-8021", applicant: "Kiran Reddy", type: "Aadhaar", scanned: "12 min ago", risk: "Review Required", score: 88, signals: 2, status: "Pending" },
  { id: "UNV-8022", applicant: "Aanya Sharma", type: "PAN Card", scanned: "45 min ago", risk: "Low Risk", score: 12, signals: 0, status: "Verified" },
  { id: "UNV-8023", applicant: "Rohan Kumar", type: "Passport", scanned: "2 hours ago", risk: "Suspicious", score: 94, signals: 3, status: "Escalated" },
  { id: "UNV-8024", applicant: "Priya Singh", type: "Voter ID", scanned: "3 hours ago", risk: "Low Risk", score: 8, signals: 0, status: "Verified" },
  { id: "UNV-8025", applicant: "Unknown ID", type: "Unknown", scanned: "4 hours ago", risk: "Undetermined", score: 50, signals: 1, status: "Pending" },
  { id: "UNV-8026", applicant: "Suresh Babu", type: "Aadhaar", scanned: "5 hours ago", risk: "Review Required", score: 72, signals: 1, status: "Pending" },
];

function RiskBadge({ level }: { level: string }) {
  if (level === "Low Risk") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--emerald)]/10 text-[var(--emerald)]">
        Low Risk
      </span>
    );
  }
  if (level === "Review Required") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--terracotta)]/10 text-[var(--terracotta)]">
        Review Required
      </span>
    );
  }
  if (level === "Suspicious") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-900/20 text-red-700">
        Suspicious
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--sage)]/20 text-[var(--sage)]">
      Undetermined
    </span>
  );
}

function DashboardPage() {
  const { search } = useApp();
  const navigate = useNavigate();

  const filteredScans = useMemo(
    () => recentScans.filter((s) => matchesSearch(search, s.id, s.applicant, s.type, s.status)),
    [search],
  );

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredScans.length / ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search]);
  const currentScans = filteredScans.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <RouteGuard allowedRoles={["officer", "forensic analyst", "security"]}>
      <AppLayout>
        <PageHeader
          title="Good morning. DOCUMENT SECURITY OVERVIEW"
          description="Real-time telemetry and forensic analysis of identity documents."
        />

        {/* Top Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <StatCard label="Documents Scanned" value="1,248" delta="+128 this week" tone="default" icon={FileSearch} />
          <StatCard label="Signals Detected" value="23" delta="Across 18 cases" tone="default" icon={Activity} />
          <StatCard label="Review Required" value="47" delta="Awaiting human verification" tone="warning" icon={ClipboardList} />
          <StatCard label="High-Risk Signals" value="14" delta="Escalated immediately" tone="danger" icon={ShieldAlert} />
        </div>

        {/* Recent Scans Table */}
        <Card className="mt-8 glass-card animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--charcoal)]/5 pb-4">
            <CardTitle className="text-lg font-light tracking-tight text-[var(--charcoal)]">Recent Scans</CardTitle>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--charcoal)]/60 bg-[var(--charcoal)]/5 px-3 py-1.5 rounded-full">
              {filteredScans.length} Total
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-[var(--charcoal)]/5">
                  <TableHead className="text-[var(--charcoal)]/70">Document</TableHead>
                  <TableHead className="text-[var(--charcoal)]/70">Type</TableHead>
                  <TableHead className="text-[var(--charcoal)]/70">Scanned</TableHead>
                  <TableHead className="text-right text-[var(--charcoal)]/70">Risk Score</TableHead>
                  <TableHead className="text-[var(--charcoal)]/70">Signals</TableHead>
                  <TableHead className="text-[var(--charcoal)]/70">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentScans.map((s) => (
                  <TableRow
                    key={s.id}
                    className="premium-table-row cursor-pointer border-[var(--charcoal)]/5 transition-all duration-500 hover:bg-[var(--sage)]/10 hover:shadow-[0_4px_15px_rgba(142,173,154,0.1)] relative"
                    onClick={() => navigate({ to: "/review" })}
                  >
                    <TableCell className="font-medium text-[var(--charcoal)]">{s.id} <span className="text-[var(--charcoal)]/50 text-xs ml-2">{s.applicant}</span></TableCell>
                    <TableCell className="text-[var(--charcoal)]/80">{s.type}</TableCell>
                    <TableCell className="text-[var(--charcoal)]/60 text-xs">{s.scanned}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={s.score > 70 ? "text-[var(--terracotta)] font-medium" : "text-[var(--emerald)] font-medium"}>
                        {s.score}/100
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--charcoal)]/5 text-xs text-[var(--charcoal)]/80">
                        {s.signals}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RiskBadge level={s.risk} />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredScans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-[var(--charcoal)]/50">
                      No scans match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--charcoal)]/5">
                <div className="text-xs text-[var(--charcoal)]/60">
                  Showing <span className="font-medium text-[var(--charcoal)]">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-[var(--charcoal)]">{Math.min(page * ITEMS_PER_PAGE, filteredScans.length)}</span> of <span className="font-medium text-[var(--charcoal)]">{filteredScans.length}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 px-2 border-[var(--charcoal)]/10 text-[var(--charcoal)]">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 px-2 border-[var(--charcoal)]/10 text-[var(--charcoal)]">
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
