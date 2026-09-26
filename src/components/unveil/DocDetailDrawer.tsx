import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiskBadge } from "@/components/unveil/RiskBadge";
import { AlertTriangle, FileBarChart } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { analyzedDocuments, tamperReasons } from "@/lib/sample-data";
import { downloadFile, generateDocumentReport } from "@/lib/export-report";
import { toast } from "sonner";
import { useMemo } from "react";

export function DocDetailDrawer() {
  const { activeDocId, closeDoc } = useApp();
  const doc = useMemo(
    () => analyzedDocuments.find((d) => d.id === activeDocId) ?? null,
    [activeDocId],
  );
  const open = !!doc;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeDoc()}>
      <SheetContent className="w-full sm:max-w-lg glass border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        {doc && (
          <div className="animate-fade-up">
            <SheetHeader className="border-b border-white/[0.06] pb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{doc.id}</p>
              <SheetTitle className="text-left text-2xl font-light tracking-tight text-foreground mt-1">{doc.name}</SheetTitle>
              <SheetDescription className="text-left mt-2 tracking-wide">
                {doc.type} · Application <span className="font-mono text-foreground/80">{doc.applicationId}</span> · Uploaded {doc.uploaded}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-8 space-y-8 px-2">
              <div className="flex items-center justify-between">
                <RiskBadge level={doc.risk} />
                <p className="text-4xl font-extralight tabular-nums text-primary">
                  {doc.tamperScore}
                  <span className="text-base text-muted-foreground/50 font-light">/100</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tamper score</p>
                <Progress value={doc.tamperScore} className="mt-3 h-1.5 rounded-full" />
                <div className="mt-2 flex justify-between text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
                  <span>Clean</span>
                  <span>Suspicious</span>
                  <span>Tampered</span>
                </div>
              </div>

              {doc.risk !== "Low" && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Suspicious flags</p>
                  <ul className="mt-3 space-y-2">
                    {tamperReasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-2xl border border-destructive/15 bg-destructive/[0.04] p-4 text-sm transition-all duration-500 hover:bg-destructive/[0.06]">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive-foreground/70" />
                        <span className="text-foreground/90">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-white/[0.06] bg-black/15 p-4 text-xs backdrop-blur-sm">
                <p className="font-semibold text-foreground uppercase tracking-[0.12em] text-[10px]">Document metadata</p>
                <ul className="mt-3 space-y-2.5 text-muted-foreground">
                  <li className="flex justify-between items-center border-b border-white/[0.04] pb-2"><span>Pages</span><span className="font-mono text-foreground">4</span></li>
                  <li className="flex justify-between items-center border-b border-white/[0.04] pb-2"><span>SHA-256</span><span className="font-mono text-foreground">a91c…f4d2</span></li>
                  <li className="flex justify-between items-center"><span>OCR confidence</span><span className="font-mono text-foreground">97.3%</span></li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  size="default"
                  onClick={async () => {
                    const content = await generateDocumentReport(doc, tamperReasons);
                    downloadFile(`${doc.id}-report.txt`, content);
                    toast.success(`Report for ${doc.id} downloaded`);
                  }}
                >
                  <FileBarChart className="mr-2 h-4 w-4" /> Generate report
                </Button>
                <Button size="default" variant="outline" onClick={() => toast("Forwarded to forensic analyst")}>
                  Send to forensic analyst
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
