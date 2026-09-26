import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/sample-data";

interface AlertCardProps {
  id: string;
  title: string;
  source: string;
  time: string;
  severity: Severity;
  onClick?: () => void;
}

export function AlertCard({ id, title, source, time, severity, onClick }: AlertCardProps) {
  const map = {
    Low: { icon: Info, tone: "text-muted-foreground", ring: "border-l-muted-foreground/40" },
    Medium: { icon: AlertTriangle, tone: "text-warning-foreground", ring: "border-l-warning/60" },
    High: { icon: ShieldAlert, tone: "text-destructive-foreground", ring: "border-l-destructive/60" },
  } as const;
  const { icon: Icon, tone, ring } = map[severity];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3.5 rounded-2xl border border-white/[0.06] border-l-[3px] bg-black/15 p-3.5 text-left transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-sm",
        "hover:bg-primary/[0.04] hover:border-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        ring,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[13px] font-medium text-foreground tracking-wide">{title}</p>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{time}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground font-medium">
          <span className="font-mono">{id}</span> <span className="opacity-40">·</span> Source:{" "}
          <span className="font-mono">{source}</span>
        </p>
      </div>
    </button>
  );
}
