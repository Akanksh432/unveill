import { cn } from "@/lib/utils";

interface ActivityItem {
  id: number;
  time: string;
  actor: string;
  action: string;
  ref: string;
  tone: "success" | "danger" | "warning" | "info";
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  const dot = {
    success: "bg-success-foreground/60",
    danger: "bg-destructive-foreground/60",
    warning: "bg-warning-foreground/60",
    info: "bg-primary",
  };
  return (
    <ol className="space-y-4">
      {items.map((it) => (
        <li key={it.id} className="flex items-start gap-3 rounded-2xl p-2 transition-all duration-500 hover:bg-white/[0.02]">
          <div className="flex flex-col items-center pt-1">
            <span className={cn("h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]", dot[it.tone])} />
            <span className="mt-1 h-full w-px bg-white/[0.06]" />
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm text-foreground tracking-wide">
                <span className="font-medium">{it.actor}</span>{" "}
                <span className="text-muted-foreground">{it.action}</span>
              </p>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{it.time}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ref: <span className="font-mono">{it.ref}</span>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
