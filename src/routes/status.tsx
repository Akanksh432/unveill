import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useMemo } from "react";
import { AppLayout, PageHeader } from "@/components/unveil/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/unveil/Timeline";
import { Clock, Search, Upload, Bell } from "lucide-react";
import { downloadFile, generateAuditReport } from "@/lib/export-report";
import { toast } from "sonner";
import { validateFile } from "@/lib/file-validation";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/status")({
  component: StatusPage,
});

function StatusPage() {
  const { applications } = useStore();
  const [trackId, setTrackId] = useState("UNV-8021");
  const [activeAppId, setActiveAppId] = useState("UNV-8021");
  const fileRef = useRef<HTMLInputElement>(null);

  const app = useMemo(() => applications[activeAppId], [applications, activeAppId]);

  const downloadSummary = async () => {
    if (!app) return;
    const content = await generateAuditReport({
      title: `Application summary — ${app.trackingId}`,
      subject: `${app.applicant} · ${app.product}`,
      sections: [
        {
          heading: "Application",
          rows: [
            ["Tracking ID", app.trackingId],
            ["Applicant", app.applicant],
            ["Product", app.product],
            ["Submitted", app.submittedOn],
            ["ETA", app.eta],
          ],
        },
        { heading: "Timeline", rows: app.stages.map((s) => [s.label, `${s.status} · ${s.date}`]) },
        { heading: "Notifications", rows: app.notifications.map((n) => [n.time, n.message]) },
      ],
    });
    downloadFile(`${app.trackingId}-summary.pdf`, content, "application/pdf");
    toast.success("Summary downloaded");
  };

  const handleTrack = () => {
    const id = trackId.trim().toUpperCase();
    if (applications[id]) {
      setActiveAppId(id);
      toast.success(`Loaded ${id}`);
    } else {
      toast.error(`No application found for ${id || "(empty)"}`);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Customer Status"
        description="Track an application end-to-end with full transparency."
      />

      <Card className="glass-card animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 transition-colors focus-within:text-primary" />
            <Input
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="pl-9 font-mono rounded-2xl border-white/[0.08] bg-black/15 text-foreground placeholder:text-muted-foreground/50 transition-all duration-500 focus-visible:ring-primary/30"
              placeholder="Enter tracking ID (e.g. UNV-8021)"
            />
          </div>
          <Button
            className="shadow-[0_0_20px_rgba(212,175,55,0.15)]"
            onClick={handleTrack}
          >
            Track application
          </Button>
        </CardContent>
      </Card>

      {app ? (
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between border-b border-white/[0.06] pb-4">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{app.trackingId}</p>
                <CardTitle className="text-xl font-light tracking-tight text-foreground">{app.applicant} <span className="text-muted-foreground/50 font-normal">·</span> {app.product}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground/80">Submitted on {app.submittedOn}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                <Clock className="h-3.5 w-3.5" />
                {app.eta}
              </span>
            </CardHeader>
            <CardContent className="pt-6">
              <Timeline stages={app.stages} />

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    try {
                      const rateRes = await fetch("/api/rate-limit");
                      if (rateRes.status === 429) {
                        toast.error("Rate limit exceeded. Please wait.");
                        if (fileRef.current) fileRef.current.value = "";
                        return;
                      }
                    } catch (err) {
                      const now = Date.now();
                      const lastReset = parseInt(localStorage.getItem("rl_reset") || "0", 10);
                      let count = parseInt(localStorage.getItem("rl_count") || "0", 10);
                      
                      if (now > lastReset) {
                        count = 0;
                        localStorage.setItem("rl_reset", String(now + 60000));
                      }
                      if (count >= 10) {
                        toast.error("Rate limit exceeded. Please wait.");
                        if (fileRef.current) fileRef.current.value = "";
                        return;
                      }
                      localStorage.setItem("rl_count", String(count + 1));
                    }

                    const validation = await validateFile(f);
                    if (!validation.valid) {
                      toast.error(`Invalid file: ${f.name}`, { description: validation.error });
                    } else {
                      toast.success(`${f.name} uploaded for ${app.trackingId}`);
                    }
                  }
                  if (fileRef.current) fileRef.current.value = "";
                }}
              />
              <div className="mt-8 flex flex-wrap gap-3 pt-4 border-t border-border/20">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />Upload Missing Document
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadSummary}>Download summary</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Card className="glass-card">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-sm flex items-center gap-2 font-light text-foreground"><Bell className="h-4 w-4 text-primary" /> Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {app.notifications.map((n) => (
                  <div key={n.id} className="rounded-2xl border border-white/[0.06] bg-black/10 p-4 transition-all duration-500 hover:border-primary/15">
                    <p className="text-sm text-foreground/90 tracking-wide">{n.message}</p>
                    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{n.time}</p>
                  </div>
                ))}
                {app.notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                )}
              </CardContent>
            </Card>

            {app.stage === "Rejected" && (
              <Card className="border-warning/30 bg-warning/[0.05] backdrop-blur-sm shadow-[0_0_20px_rgba(255,189,46,0.05)]">
                <CardContent className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-warning">If rejected</p>
                  <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
                    Reasons will appear here in clear language, alongside any documents required to re-open
                    the application.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card className="glass-card animate-fade-up">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center p-8">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-light tracking-tight text-foreground">Application Not Found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              We couldn't find an application matching tracking ID <strong>{activeAppId}</strong>.
              Try one of the valid mock IDs like UNV-8021 or UNV-8022.
            </p>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
