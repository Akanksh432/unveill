import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UnveilLogo } from "@/components/unveil/UnveilLogo";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background styling elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 800,
            height: 800,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(0, 229, 255, 0.03) 0%, transparent 60%)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto text-center animate-fade-up">
        {/* Prominent Full Lockup Logo */}
        <div className="mb-12" style={{ animation: "logo-pulse 4s ease-in-out infinite" }}>
          <UnveilLogo variant="full" size={280} />
        </div>

        {/* Tagline Headline */}
        <h1 
          className="text-4xl sm:text-6xl font-extralight tracking-tight mb-6"
          style={{ color: "#ffffff", textShadow: "0 0 40px rgba(0,229,255,0.2)" }}
        >
          Every anomaly leaves a <span className="font-medium" style={{ color: "#00E5FF" }}>signal.</span>
        </h1>

        {/* Positioning Line */}
        <p className="text-base sm:text-lg text-muted-foreground font-light mb-12 max-w-2xl leading-relaxed">
          A purely client-side forensic screening assistant. Analyze identity documents instantly and securely—without ever sending sensitive images to a server.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate({ to: isAuthenticated ? "/review" : "/login" })}
          className="group relative inline-flex items-center justify-center px-8 py-4 rounded-xl text-sm font-semibold tracking-widest uppercase transition-all duration-500 overflow-hidden"
          style={{
            background: "rgba(0, 229, 255, 0.1)",
            color: "#00E5FF",
            border: "1px solid rgba(0, 229, 255, 0.3)",
            boxShadow: "0 0 20px rgba(0, 229, 255, 0.1)",
          }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" 
            style={{ transform: "skewX(-20deg)" }}
          />
          Begin Review
        </button>
      </div>

      <style>{`
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes logo-pulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.15)); }
          50% { filter: drop-shadow(0 0 25px rgba(0, 229, 255, 0.3)); }
        }
        .animate-fade-up {
          animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
