export function UnveilLogo({
  variant = "icon",
  size = 192,
  className = "",
}: {
  variant?: "icon" | "full";
  size?: number;
  className?: string;
}) {
  const iconSize = variant === "full" ? size * 0.3 : size;

  return (
    <div
      className={`flex items-center justify-center gap-4 ${className}`}
      style={variant === "icon" ? { width: size, height: size } : { height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={iconSize}
        height={iconSize}
        className="shrink-0"
      >
        <defs>
          <linearGradient id="unveilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#888888" />
          </linearGradient>
          <linearGradient id="signalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
            <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </linearGradient>
          <filter id="unveilGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer aperture/iris */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="url(#unveilGrad)"
          strokeWidth="4"
          strokeDasharray="4 8"
          opacity="0.3"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="url(#unveilGrad)"
          strokeWidth="2"
          opacity="0.5"
        />

        {/* Inner pupil / core */}
        <circle
          cx="50"
          cy="50"
          r="12"
          fill="none"
          stroke="url(#unveilGrad)"
          strokeWidth="3"
        />
        <circle cx="50" cy="50" r="4" fill="#ffffff" />

        {/* The Signal (Anomaly) */}
        <path
          d="M10 50 Q 50 10, 90 50"
          fill="none"
          stroke="url(#signalGrad)"
          strokeWidth="3"
          filter="url(#unveilGlow)"
          className="animate-pulse"
        />
        <path
          d="M50 10 L50 38"
          fill="none"
          stroke="#00E5FF"
          strokeWidth="2"
          opacity="0.8"
          filter="url(#unveilGlow)"
        />
      </svg>

      {variant === "full" && (
        <span
          className="font-sans font-semibold tracking-[0.3em] uppercase text-foreground"
          style={{
            fontSize: size * 0.25,
            letterSpacing: "0.25em",
          }}
        >
          UNVEIL
        </span>
      )}
    </div>
  );
}
