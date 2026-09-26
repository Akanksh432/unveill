import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppLayout, PageHeader } from "@/components/unveil/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Check, X, AlertTriangle, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { downloadFile, generateAuditReport } from "@/lib/export-report";
import { toast } from "sonner";
import { RouteGuard } from "@/components/unveil/RouteGuard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/cross-check")({
  component: CrossCheckPage,
});

function CrossCheckPage() {
  const { applications, rerunCrossCheck, escalateApplication } = useStore();
  const [trackId, setTrackId] = useState("UNV-8021");
  const [activeAppId, setActiveAppId] = useState("UNV-8021");

  const app = useMemo(() => applications[activeAppId], [applications, activeAppId]);
  
  const crossCheckData = app?.crossCheck;
  const mismatches = crossCheckData?.fields.filter((f) => !f.match).length || 0;

  const handleTrack = () => {
    const id = trackId.trim().toUpperCase();
    if (applications[id]) {
      setActiveAppId(id);
      toast.success(`Loaded cross-check for ${id}`);
    } else {
      toast.error(`No application found for ${id || "(empty)"}`);
    }
  };

  const exportCrossCheck = async () => {
    if (!app || !crossCheckData) return;
    const content = await generateAuditReport({
      title: `Cross-check report — ${app.trackingId}`,
      subject: app.applicant,
      sections: [
        {
          heading: "Field comparison",
          rows: crossCheckData.fields.map((f) => [
            f.field,
            `idDocumentValue=${f.idDocumentValue} | bank=${f.kycRecordValue} | tax=${f.secondaryDocumentValue} | match=${f.match}`,
          ]),
        },
        { heading: "Summary", rows: [["Inconsistencies", String(mismatches)]] },
      ],
    });
    downloadFile(`${app.trackingId}-cross-check.pdf`, content, "application/pdf");
    toast.success("Cross-check report downloaded");
  };

  return (
    <RouteGuard allowedRoles={["officer", "forensic analyst"]}>
      <AppLayout>
        <PageHeader
          title="Cross-Check"
          description="Compare values across submitted documents to surface inconsistencies."
          actions={
            app ? (
              <>
                <Button size="sm" variant="outline" onClick={() => {
                  rerunCrossCheck(app.trackingId);
                  toast.success("Cross-check re-run complete");
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Re-run check
                </Button>
                <Button size="sm" onClick={exportCrossCheck}>Export report</Button>
              </>
            ) : null
          }
        />

        <Card className="glass-card animate-fade-up mb-8" style={{ animationDelay: "0.05s" }}>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 transition-colors focus-within:text-primary" />
              <Input
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                className="pl-9 font-mono rounded-2xl border-white/[0.08] bg-black/15 text-foreground placeholder:text-muted-foreground/50 transition-all duration-500 focus-visible:ring-primary/30 focus-visible:border-primary/25"
                placeholder="Enter application ID (e.g. UNV-8021)"
              />
            </div>
            <Button
              className="shadow-[0_0_20px_rgba(212,175,55,0.15)]"
              onClick={handleTrack}
            >
              Load Data
            </Button>
          </CardContent>
        </Card>

        {app && crossCheckData ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <Card className="glass-card lg:col-span-3">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-lg font-medium text-foreground">
                  Application <span className="font-mono text-primary/90">{app.trackingId}</span>{" "}
                  <span className="text-muted-foreground/80">· {app.applicant}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Field</TableHead>
                      <TableHead>Primary Document (Extracted OCR)</TableHead>
                      <TableHead>KYC Record</TableHead>
                      <TableHead>Secondary Document</TableHead>
                      <TableHead className="text-right">Match</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crossCheckData.fields.map((f) => (
                      <TableRow key={f.field} className="premium-table-row transition-all duration-500 hover:bg-primary/[0.03]">
                        <TableCell className="font-medium text-foreground/90">{f.field}</TableCell>
                        <TableCell className={cellTone(f)}>{f.idDocumentValue}</TableCell>
                        <TableCell className={cellTone(f)}>{f.kycRecordValue}</TableCell>
                        <TableCell className={cellTone(f)}>{f.secondaryDocumentValue}</TableCell>
                        <TableCell className="text-right">
                          {f.match ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success shadow-[0_0_10px_rgba(39,201,63,0.1)]">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/15 text-destructive shadow-[0_0_10px_rgba(255,95,86,0.15)]">
                              <X className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              {mismatches > 0 ? (
                <Card className="border-destructive/30 bg-destructive/[0.05] backdrop-blur-sm shadow-[0_0_30px_rgba(255,95,86,0.05)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4 drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em]">Summary</p>
                    </div>
                    <p className="mt-4 text-4xl font-semibold tabular-nums text-foreground drop-shadow-sm">{mismatches}</p>
                    <p className="text-sm text-destructive/80 font-medium">inconsistencies found</p>
                    <p className="mt-4 text-xs text-muted-foreground/90 leading-relaxed">
                      Multiple data points are mismatched across the submitted documents. Recommend manual forensic analyst review.
                    </p>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="mt-5 w-full bg-destructive/90 hover:bg-destructive shadow-[0_0_15px_rgba(255,95,86,0.3)] transition-all hover:shadow-[0_0_25px_rgba(255,95,86,0.5)] text-white"
                      onClick={() => {
                        escalateApplication(app.trackingId);
                        toast(`Escalated ${app.trackingId} to forensic analyst`);
                      }}
                    >
                      Escalate to forensic analyst
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-success/30 bg-success/[0.05] backdrop-blur-sm shadow-[0_0_30px_rgba(39,201,63,0.05)] overflow-hidden relative">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-success/20 rounded-full blur-xl pointer-events-none"></div>
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-2 text-success">
                      <ShieldCheck className="h-5 w-5 drop-shadow-[0_0_5px_rgba(39,201,63,0.5)]" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em]">Verified</p>
                    </div>
                    <p className="mt-4 text-4xl font-semibold tabular-nums text-foreground drop-shadow-sm">0</p>
                    <p className="text-sm text-success font-medium">inconsistencies found</p>
                    <div className="mt-4 rounded-md bg-success/10 border border-success/20 p-3">
                      <p className="text-xs text-success-foreground font-medium leading-relaxed">
                        Data perfectly aligns across idDocumentValues, KYC Records, and Secondary Documents. The application meets baseline automated cross-checks.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/40 bg-black/5 dark:bg-black/20 backdrop-blur-sm">
                <CardContent className="p-5 text-xs">
                  <p className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Decision impact</p>
                  <ul className="mt-3 space-y-2.5 text-muted-foreground/80">
                    <li className="flex justify-between items-center border-b border-border/10 pb-2"><span>Income mismatch weight</span><span className="text-destructive font-medium">High</span></li>
                    <li className="flex justify-between items-center border-b border-border/10 pb-2"><span>DOB mismatch weight</span><span className="text-warning font-medium">Medium</span></li>
                    <li className="flex justify-between items-center"><span>Employer variance</span><span className="text-success font-medium">Low</span></li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="glass-card animate-fade-up">
            <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center p-8">
              <Search className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No Data Available</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Please enter a valid tracking ID (e.g., UNV-8021) to view the cross-check report.
              </p>
            </CardContent>
          </Card>
        )}
      </AppLayout>
    </RouteGuard>
  );
}

function cellTone(f: { match: boolean }) {
  return f.match ? "text-foreground/90" : "text-destructive font-medium";
}
