import { useEffect, useState, useMemo } from "react";

const STATUS_MESSAGES = [
  "Extracting document text...",
  "Hashing signatures...",
  "Mapping metadata layers...",
  "Evaluating logic discrepancies via Llama-3.1...",
  "Cross-referencing compliance hashes...",
  "Running neural tamper detection...",
  "Validating document integrity...",
  "Synthesizing risk assessment...",
];

function MatrixColumn({ delay, chars }: { delay: number; chars: string[] }) {
  return (
    <div
      className="flex flex-col gap-[2px] overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {chars.map((c, i) => (
        <span
          key={i}
          className="font-mono text-[9px] leading-none text-primary/40"
          style={{
            animation: `matrix-pulse ${1.2 + (i % 3) * 0.3}s ease-in-out infinite`,
            animationDelay: `${delay + i * 80}ms`,
          }}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

export function NeuralFraudScanLoader() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const columns = useMemo(
    () =>
      Array.from({ length: 12 }, () =>
        Array.from({ length: 8 }, () => (Math.random() > 0.5 ? "1" : "0")),
      ),
    [],
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(25,25,28,0.85)] p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
          Neural Fraud Scan
        </p>
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Active
        </span>
      </div>

      <div className="relative mx-auto flex h-52 max-w-sm items-center justify-center">
        {/* Matrix backdrop */}
        <div className="absolute inset-0 flex justify-center gap-1 overflow-hidden opacity-40">
          {columns.map((chars, i) => (
            <MatrixColumn key={i} delay={i * 120} chars={chars} />
          ))}
        </div>

        {/* Holographic document outline */}
        <div className="neural-doc-outline relative z-10 h-40 w-28 rounded-lg border border-primary/30 bg-black/30 backdrop-blur-sm">
          {/* Document lines */}
          <div className="absolute inset-x-3 top-4 space-y-2">
            <div className="h-1 rounded-full bg-primary/20" />
            <div className="h-1 w-4/5 rounded-full bg-white/10" />
            <div className="h-1 w-full rounded-full bg-white/10" />
            <div className="h-1 w-3/5 rounded-full bg-white/10" />
            <div className="mt-3 h-1 w-full rounded-full bg-white/5" />
            <div className="h-1 w-4/5 rounded-full bg-white/5" />
            <div className="h-1 w-2/3 rounded-full bg-white/5" />
          </div>

          {/* Golden laser line */}
          <div className="neural-laser absolute left-0 right-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
        </div>

        {/* Corner brackets */}
        <div className="pointer-events-none absolute inset-8 border border-primary/10" />
        <div className="pointer-events-none absolute left-6 top-6 h-4 w-4 border-l border-t border-primary/40" />
        <div className="pointer-events-none absolute right-6 top-6 h-4 w-4 border-r border-t border-primary/40" />
        <div className="pointer-events-none absolute bottom-6 left-6 h-4 w-4 border-b border-l border-primary/40" />
        <div className="pointer-events-none absolute bottom-6 right-6 h-4 w-4 border-b border-r border-primary/40" />
      </div>

      {/* Terminal status log */}
      <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3 font-mono text-xs">
        <div className="flex items-start gap-2">
          <span className="text-primary/60">&gt;</span>
          <span
            key={statusIndex}
            className="text-muted-foreground transition-all duration-300"
            style={{ animation: "fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            {STATUS_MESSAGES[statusIndex]}
          </span>
          <span className="neural-terminal-cursor ml-0.5 inline-block h-3.5 w-[2px] bg-primary" />
        </div>
      </div>
    </div>
  );
}
