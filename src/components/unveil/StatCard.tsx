import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "default" | "success" | "warning" | "danger";
  icon?: LucideIcon;
}

export function StatCard({ label, value, delta, tone = "default", icon: Icon }: StatCardProps) {
  const toneStyles = {
    default: "text-primary",
    success: "text-success-foreground",
    warning: "text-warning-foreground",
    danger: "text-destructive-foreground",
  } as const;

  return (
    <Card className="glass-card relative overflow-hidden p-6 transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] hover:shadow-[0_8px_32px_rgba(212,175,55,0.08)] group">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-3 text-4xl font-extralight tabular-nums tracking-tight text-foreground">{value}</p>
          {delta && (
            <p className={cn("mt-2 text-[11px] font-medium tracking-wide", toneStyles[tone])}>{delta}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "rounded-2xl border border-white/[0.06] bg-black/20 p-3 transition-all duration-500 group-hover:scale-105 group-hover:border-primary/20",
              toneStyles[tone],
            )}
          >
            <Icon className="h-5 w-5 opacity-80" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );
}
