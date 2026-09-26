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
  // Map tones strictly to Emerald (trusted) or Terracotta (high-risk)
  const isDanger = tone === "danger" || tone === "warning";
  
  const textColor = isDanger ? "text-[var(--terracotta)]" : "text-[var(--emerald)]";
  const lineColor = isDanger ? "bg-[var(--terracotta)]" : "bg-[var(--emerald)]";

  return (
    <Card className="glass-card relative overflow-hidden p-6 transition-all duration-500 ease-[var(--ease-premium)] group">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--charcoal)]/60">{label}</p>
          <p className={cn("mt-3 text-4xl font-semibold tracking-tight transition-colors duration-500", textColor)}>{value}</p>
          {delta && (
            <p className={cn("mt-2 text-[11px] font-medium tracking-wide opacity-80", textColor)}>{delta}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-2xl border border-[var(--charcoal)]/5 bg-[var(--charcoal)]/5 p-3 transition-transform duration-500 group-hover:scale-105", textColor)}>
            <Icon className="h-5 w-5 opacity-80" />
          </div>
        )}
      </div>
      {/* Animated bottom line */}
      <div 
        className={cn("absolute inset-x-0 bottom-0 h-1 origin-left transition-transform duration-1000 ease-out", lineColor)}
        style={{ transform: "scaleX(0)", animation: "draw-line 1s 0.2s forwards" }}
      />
      <style>{`
        @keyframes draw-line {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </Card>
  );
}
