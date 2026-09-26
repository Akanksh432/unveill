import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/sample-data";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const styles: Record<RiskLevel, string> = {
    Low: "bg-success/20 text-success-foreground border-success/25",
    Medium: "bg-warning/20 text-warning-foreground border-warning/25",
    High: "bg-destructive/25 text-destructive-foreground border-destructive/30",
  };
  const dots: Record<RiskLevel, string> = {
    Low: "bg-success-foreground/70",
    Medium: "bg-warning-foreground/80",
    High: "bg-destructive-foreground/80",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium tracking-[0.12em] uppercase",
        styles[level],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[level])} />
      {level} Risk
    </span>
  );
}
