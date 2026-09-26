import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/unveil/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, FileBarChart, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { reports, type ReportItem } from "@/lib/sample-data";
import { useApp, matchesSearch } from "@/lib/app-context";
import { downloadFile, generateAuditReport } from "@/lib/export-report";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RouteGuard } from "@/components/unveil/RouteGuard";
import { useState, useMemo, useEffect } from "react";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { search } = useApp();
  
  const filtered = useMemo(() => 
    reports.filter((r) =>
      matchesSearch(search, r.id, r.title, r.application, r.type, r.status)
    ),
    [search]
  );

  const ready = reports.filter((r) => r.status === "Ready").length;
  const generating = reports.filter((r) => r.status === "Generating").length;

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const currentReports = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const download = async (r: ReportItem) => {
    if (r.status !== "Ready") {
      toast.error(`${r.id} is still ${r.status.toLowerCase()}`);
      return;
    }
    const content = await generateAuditReport({
      title: r.title,
      subject: r.application,
      sections: [
        {
          heading: "Report metadata",
          rows: [
            ["Report ID", r.id],
            ["Type", r.type],
            ["Application", r.application],
            ["Generated", r.generated],
            ["Hash", r.hash],
          ],
        },
      ],
    });
    downloadFile(`${r.id}.pdf`, content, "application/pdf");
    toast.success(`${r.id} downloaded`);
  };

  return (
    <RouteGuard allowedRoles={["officer", "forensic analyst", "security"]}>
      <AppLayout>
        <PageHeader
          title="Reports"
          description="Generated audit, cross-check, and security reports with verifiable hashes."
          actions={
            <Button
              className="shadow-[0_0_20px_rgba(212,175,55,0.15)]"
              onClick={async () => {
              const content = await generateAuditReport({
                title: "All reports digest",
                sections: [
                  {
                    heading: "Reports",
                    rows: reports.map((r) => [r.id, `${r.title} · ${r.status} · ${r.hash}`]),
                  },
                ],
              });
              downloadFile(`reports-digest-${Date.now()}.pdf`, content, "application/pdf");
              toast.success("Digest downloaded");
            }}
          >
            <Download className="mr-2 h-4 w-4 drop-shadow-sm" /> Export digest
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <Card className="glass-card transition-all duration-500 hover:scale-[1.01]">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">Total reports</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-foreground drop-shadow-sm">{reports.length}</p>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/[0.05] backdrop-blur-md transition-all hover:border-success/50 hover:shadow-[0_0_20px_rgba(39,201,63,0.05)]">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-success">Ready</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-foreground drop-shadow-sm">{ready}</p>
          </CardContent>
        </Card>
        <Card className="border-warning/30 bg-warning/[0.05] backdrop-blur-md transition-all hover:border-warning/50 hover:shadow-[0_0_20px_rgba(255,189,46,0.05)]">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-warning">Generating</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-foreground drop-shadow-sm">{generating}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 glass-card animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-4">
          <CardTitle className="text-lg font-light tracking-tight text-foreground flex items-center gap-2.5">
            <FileBarChart className="h-5 w-5 text-primary" /> Audit reports
          </CardTitle>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-black/15 px-3 py-1.5 rounded-full">{filtered.length} of {reports.length}</span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentReports.map((r) => (
                <TableRow key={r.id} className="premium-table-row transition-all duration-500 hover:bg-primary/[0.03]">
                  <TableCell className="font-mono text-xs text-muted-foreground/80">{r.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{r.title}</TableCell>
                  <TableCell className="text-muted-foreground">{r.type}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground/80">{r.application}</TableCell>
                  <TableCell className="text-muted-foreground">{r.generated}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground/60">{r.hash}</TableCell>
                  <TableCell><StatusChip status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button className="border-border/40 hover:border-border/70 bg-black/5 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-black/40 text-foreground/90" size="sm" variant="outline" onClick={() => download(r)} disabled={r.status !== "Ready"}>
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No reports match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span> of <span className="font-medium text-foreground">{filtered.length}</span>
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

function StatusChip({ status }: { status: ReportItem["status"] }) {
  const map = {
    Ready: { cls: "bg-success/15 text-success border-success/30 shadow-[0_0_10px_rgba(39,201,63,0.1)]", Icon: CheckCircle2 },
    Generating: { cls: "bg-warning/15 text-warning border-warning/30 shadow-[0_0_10px_rgba(255,189,46,0.1)]", Icon: Loader2 },
    Failed: { cls: "bg-destructive/15 text-destructive border-destructive/40 shadow-[0_0_10px_rgba(255,95,86,0.15)]", Icon: AlertTriangle },
  } as const;
  const { cls, Icon } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", cls)}>
      <Icon className={cn("h-3 w-3", status === "Generating" && "animate-spin")} />
      {status}
    </span>
  );
}
