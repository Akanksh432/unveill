import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { UnveilLogo } from "@/components/unveil/UnveilLogo";
import { Eye, EyeOff, Shield, User, KeyRound, Phone, Hash, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// ─── Splash Screen ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  const msgs = [
    "Initializing Secure Environment...",
    "Loading Cryptographic Modules...",
    "Establishing Trusted Connection...",
    "UNVEIL Ready",
  ];

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIdx((i) => Math.min(i + 1, msgs.length - 1));
    }, 600);

    const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
    const doneTimer = setTimeout(() => onDone(), 2800);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "#0A0A0B",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: fadeOut ? "none" : "all",
      }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Logo with pulse glow */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
            animation: "splash-pulse 2s ease-in-out infinite",
          }}
        />
        <div style={{ animation: "splash-logo-glow 2s ease-in-out infinite" }}>
          <UnveilLogo size={180} />
        </div>
      </div>

      {/* Title */}
      <div className="mt-10 text-center">
        <h1
          className="text-2xl font-extralight"
          style={{
            color: "#D4AF37",
            letterSpacing: "0.35em",
            fontFamily: "'Inter', -apple-system, 'SF Pro Display', sans-serif",
            textShadow: "0 0 40px rgba(212,175,55,0.35)",
          }}
        >
          UNVEIL
        </h1>
        <p
          className="mt-2 text-xs font-light"
          style={{ color: "rgba(212,175,55,0.5)", letterSpacing: "0.2em" }}
        >
          ENTERPRISE SECURITY CONSOLE
        </p>
      </div>

      {/* Loading bar */}
      <div className="mt-14 w-56">
        <div
          className="h-[1px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
              animation: "splash-bar 2.2s ease-in-out forwards",
            }}
          />
        </div>
        <p
          className="mt-4 text-center text-[10px] font-mono"
          style={{ color: "rgba(212,175,55,0.5)", letterSpacing: "0.1em", minHeight: 16 }}
        >
          {msgs[msgIdx]}
        </p>
      </div>

      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes splash-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(212,175,55,0.3)); }
          50% { filter: drop-shadow(0 0 24px rgba(212,175,55,0.7)); }
        }
        @keyframes splash-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 80%; margin-left: 0%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

// ─── Gold Input ───────────────────────────────────────────────────────────────
function GoldInput({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  rightSlot,
}: {
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
        style={{ color: "rgba(212,175,55,0.5)" }}
      />
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl pl-10 pr-10 py-3 text-sm font-light text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1px solid rgba(212,175,55,0.45)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,175,55,0.08), 0 0 20px rgba(212,175,55,0.08)";
          e.currentTarget.style.background = "rgba(212,175,55,0.04)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        }}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
function LoginPage() {
  const { login, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [visible, setVisible] = useState(false);

  // Mode: "staff" | "customer"
  const [mode, setMode] = useState<"staff" | "customer">("staff");
  const [isLoading, setIsLoading] = useState(false);

  // Staff fields
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [use2FA, setUse2FA] = useState(false);

  // Customer fields
  const [trackingId, setTrackingId] = useState("");
  const [phone, setPhone] = useState("");

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/", replace: true });
  }, [isAuthenticated]);

  const handleSplashDone = () => {
    setShowSplash(false);
    requestAnimationFrame(() => setTimeout(() => setVisible(true), 50));
  };

  const handleStaffLogin = async () => {
    if (!employeeId || !password) {
      toast.error("Please enter your Employee ID and Password.");
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    // Accept any credentials for demo
    login("officer");
    toast.success("Welcome back, Officer.", { description: "Secure session established." });
    navigate({ to: "/", replace: true });
  };

  const handleCustomerLogin = async () => {
    if (!trackingId || !phone) {
      toast.error("Please enter your Tracking ID and Phone Number.");
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    login("customer");
    toast.success("Application found.", { description: `Tracking ${trackingId}` });
    navigate({ to: "/status", replace: true });
  };

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      {/* Login portal */}
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{
          background: "#0A0A0B",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute rounded-full"
            style={{
              width: 600,
              height: 600,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -60%)",
              background: "radial-gradient(circle, rgba(212,175,55,0.055) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 400,
              height: 400,
              bottom: 0,
              right: 0,
              background: "radial-gradient(circle, rgba(41,37,36,0.5) 0%, transparent 70%)",
            }}
          />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "linear-gradient(rgba(212,175,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Card */}
        <div
          className="relative w-full max-w-md"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1.5rem",
            boxShadow: "0 0 80px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.04)",
          }}
        >
          {/* Card top accent line */}
          <div
            className="absolute top-0 left-8 right-8 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)" }}
          />

          <div className="p-8">
            {/* Logo + title */}
            <div className="flex flex-col items-center mb-8">
              <div style={{ animation: "splash-logo-glow 3s ease-in-out infinite" }}>
                <UnveilLogo size={72} />
              </div>
              <h1
                className="mt-4 text-xl font-extralight tracking-[0.3em] uppercase"
                style={{ color: "#D4AF37", textShadow: "0 0 30px rgba(212,175,55,0.3)" }}
              >
                UNVEIL
              </h1>
              <p className="mt-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Secure Portal
              </p>
            </div>

            {/* Role Toggle */}
            <div
              className="relative flex mb-8 rounded-xl p-1"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Sliding indicator */}
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out"
                style={{
                  left: mode === "staff" ? "4px" : "calc(50%)",
                  background: mode === "staff"
                    ? "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))"
                    : "rgba(255,255,255,0.05)",
                  borderColor: mode === "staff" ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)",
                  border: "1px solid",
                  boxShadow: mode === "staff" ? "0 0 16px rgba(212,175,55,0.1)" : "none",
                }}
              />
              <button
                className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium tracking-wider uppercase transition-colors duration-300 rounded-lg"
                style={{ color: mode === "staff" ? "#D4AF37" : "rgba(255,255,255,0.4)" }}
                onClick={() => { setMode("staff"); setIsLoading(false); }}
              >
                <Shield className="h-3.5 w-3.5" />
                Bank Personnel
              </button>
              <button
                className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium tracking-wider uppercase transition-colors duration-300 rounded-lg"
                style={{ color: mode === "customer" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }}
                onClick={() => { setMode("customer"); setIsLoading(false); }}
              >
                <User className="h-3.5 w-3.5" />
                Customer Portal
              </button>
            </div>

            {/* ── Staff Login View ── */}
            {mode === "staff" && (
              <div style={{ animation: "fade-up 0.35s ease forwards" }}>
                <p className="mb-5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                  Bank Personnel Authentication
                </p>
                <div className="space-y-3">
                  <GoldInput
                    id="employee-id"
                    placeholder="Employee ID  (e.g. EMP-101)"
                    value={employeeId}
                    onChange={setEmployeeId}
                    icon={Hash}
                  />
                  <GoldInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                    icon={KeyRound}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </div>

                {/* 2FA checkbox */}
                <label
                  className="mt-4 flex items-center gap-3 cursor-pointer group"
                  htmlFor="2fa-check"
                >
                  <div className="relative">
                    <input
                      id="2fa-check"
                      type="checkbox"
                      checked={use2FA}
                      onChange={(e) => setUse2FA(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="h-5 w-5 rounded flex items-center justify-center transition-all duration-200"
                      style={{
                        background: use2FA ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                        border: use2FA ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        boxShadow: use2FA ? "0 0 10px rgba(212,175,55,0.2)" : "none",
                      }}
                    >
                      {use2FA && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" style={{ color: "rgba(212,175,55,0.6)" }} />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                      Hardware Key / 2FA Verified
                    </span>
                  </div>
                </label>

                <button
                  onClick={handleStaffLogin}
                  disabled={isLoading}
                  className="mt-6 w-full py-3.5 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all duration-300 disabled:opacity-60"
                  style={{
                    background: isLoading
                      ? "rgba(212,175,55,0.3)"
                      : "linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)",
                    color: "#09090B",
                    boxShadow: isLoading ? "none" : "0 0 30px rgba(212,175,55,0.3), 0 4px 16px rgba(0,0,0,0.4)",
                    letterSpacing: "0.12em",
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      Authenticating...
                    </span>
                  ) : (
                    "Secure Sign In"
                  )}
                </button>

                <p className="mt-4 text-center text-[10px] text-muted-foreground/50">
                  Demo: any Employee ID + password
                </p>
              </div>
            )}

            {/* ── Customer Portal View ── */}
            {mode === "customer" && (
              <div style={{ animation: "fade-up 0.35s ease forwards" }}>
                <p className="mb-5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                  Track Your Application
                </p>
                <div className="space-y-3">
                  <GoldInput
                    id="tracking-id"
                    placeholder="Verification Case Tracking ID  (e.g. UNV-8021)"
                    value={trackingId}
                    onChange={setTrackingId}
                    icon={Hash}
                  />
                  <GoldInput
                    id="phone"
                    type="tel"
                    placeholder="Registered Phone Number"
                    value={phone}
                    onChange={setPhone}
                    icon={Phone}
                  />
                </div>

                <button
                  onClick={handleCustomerLogin}
                  disabled={isLoading}
                  className="mt-6 w-full py-3.5 rounded-xl text-sm font-medium tracking-wider uppercase transition-all duration-300 disabled:opacity-60"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.88)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    letterSpacing: "0.1em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      Locating Application...
                    </span>
                  ) : (
                    "Track My Application"
                  )}
                </button>

                <p className="mt-4 text-center text-[10px] text-muted-foreground/50">
                  Demo: any Tracking ID + phone number
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-center text-[10px] text-muted-foreground/40 tracking-wide">
                Protected by UNVEIL · AES-256 Encrypted · ISO 27001
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes splash-logo-glow {
            0%, 100% { filter: drop-shadow(0 0 6px rgba(212,175,55,0.25)); }
            50% { filter: drop-shadow(0 0 18px rgba(212,175,55,0.6)); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}
