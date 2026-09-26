import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AlertDetailDrawer() {
  const { activeAlert, closeAlert } = useApp();
  const { acknowledgeAlert, escalateApplication } = useStore();
  const open = !!activeAlert;
  const a = activeAlert;

  const tone =
    a?.severity === "High"
      ? { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/40" }
      : a?.severity === "Medium"
        ? { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/40" }
        : { icon: Info, color: "text-muted-foreground", bg: "bg-muted/40", border: "border-border" };
  const Icon = tone.icon;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeAlert()}>
      <SheetContent className="w-full sm:max-w-md glass border-l border-white/[0.08]">
        {a && (
          <>
            <SheetHeader>
              <div className={cn("mb-2 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", tone.bg, tone.border, tone.color)}>
                <Icon className="h-3.5 w-3.5" />
                {a.severity} severity
              </div>
              <SheetTitle className="text-left text-lg font-light tracking-tight">{a.title}</SheetTitle>
              <SheetDescription className="text-left tracking-wide">
                <span className="font-mono">{a.id}</span> · Source <span className="font-mono">{a.source}</span> · {a.time}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5 px-4">
              {a.detail && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">What happened</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground tracking-wide">{a.detail}</p>
                </section>
              )}

              {a.reasons && a.reasons.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Detection reasons</p>
                  <ul className="mt-2 space-y-2">
                    {a.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-2xl border border-white/[0.06] bg-black/10 p-3 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {a.recommendation && (
                <section className={cn("rounded-2xl border p-4", tone.border, tone.bg)}>
                  <p className={cn("text-[10px] font-semibold uppercase tracking-[0.15em]", tone.color)}>Recommended action</p>
                  <p className="mt-1.5 text-sm text-foreground tracking-wide">{a.recommendation}</p>
                </section>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    acknowledgeAlert(a.id);
                    toast.success(`Alert ${a.id} acknowledged`);
                    closeAlert();
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Acknowledge
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // source holds something like UNV-2039 or DOC-8821. If it's an application, escalate it
                    if (a.source.startsWith("UNV-")) {
                      escalateApplication(a.source);
                      toast(`Escalated application ${a.source}`);
                    } else {
                      toast(`Escalated ${a.id} to security lead`);
                    }
                    closeAlert();
                  }}
                >
                  Escalate
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
