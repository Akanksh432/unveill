import { cn } from "@/lib/utils";
import { Check, Circle, Clock } from "lucide-react";

export interface TimelineStage {
  label: string;
  date: string;
  status: "done" | "current" | "pending";
}

export function Timeline({ stages }: { stages: TimelineStage[] }) {
  return (
    <ol className="relative space-y-7 border-l border-white/[0.08] pl-7 ml-3">
      {stages.map((s, i) => (
        <li key={i} className="relative group">
          <span
            className={cn(
              "absolute -left-[41px] flex h-7 w-7 items-center justify-center rounded-full border bg-black/30 shadow-sm transition-all duration-500",
              s.status === "done" && "border-success/40 text-success-foreground bg-success/15",
              s.status === "current" && "border-primary/50 text-primary bg-primary/10 shadow-[0_0_16px_rgba(212,175,55,0.2)]",
              s.status === "pending" && "border-white/[0.08] text-muted-foreground/50",
            )}
          >
            {s.status === "done" ? (
              <Check className="h-3.5 w-3.5" />
            ) : s.status === "current" ? (
              <Clock className="h-3.5 w-3.5 animate-pulse" />
            ) : (
              <Circle className="h-2 w-2" />
            )}
          </span>
          <p className={cn("text-sm font-medium tracking-wide", s.status === "pending" ? "text-muted-foreground/60" : "text-foreground/90")}>
            {s.label}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.date}</p>
        </li>
      ))}
    </ol>
  );
}
