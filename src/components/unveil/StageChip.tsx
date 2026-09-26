import { cn } from "@/lib/utils";

export function StageChip({ stage }: { stage: string }) {
  const tone =
    stage === "Approved"
      ? "bg-success/20 text-success-foreground border-success/25"
      : stage === "Rejected"
        ? "bg-destructive/20 text-destructive-foreground border-destructive/25"
        : stage === "Verified"
          ? "bg-primary/15 text-primary border-primary/25"
          : stage === "Under Review"
            ? "bg-warning/20 text-warning-foreground border-warning/25"
            : "bg-muted/50 text-muted-foreground border-white/[0.06]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]",
        tone,
      )}
    >
      {stage}
    </span>
  );
}
