import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UnveilLogo } from "@/components/unveil/UnveilLogo";
import { useApp } from "@/lib/app-context";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();
  const [animationStage, setAnimationStage] = useState(0);

  // Orchestrate the reveal sequence
  useEffect(() => {
    const t1 = setTimeout(() => setAnimationStage(1), 800); // Start logo clip
    const t2 = setTimeout(() => setAnimationStage(2), 2200); // Tagline + CTA fade up
    const t3 = setTimeout(() => setAnimationStage(3), 4500); // Transition to Hero Layout
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${animationStage < 3 ? 'bg-[var(--sage)]' : 'bg-[var(--ivory)]'} flex flex-col items-center justify-center relative overflow-x-hidden`}>
      
      {/* THE REVEAL ANIMATION STAGE (Stages 0, 1, 2) */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 z-50 pointer-events-none ${animationStage < 3 ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Abstract Orbiting Fragments */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-96 h-96 flex items-center justify-center">
            {/* Emerald ID Card Shape */}
            <div className={`absolute w-40 h-28 bg-[var(--emerald)] rounded-xl opacity-0 transform rotate-12 transition-all duration-[2000ms] ease-[var(--ease-premium)]
              ${animationStage >= 0 ? 'opacity-20 scale-100 rotate-12 translate-x-12 translate-y-8' : 'scale-50 translate-x-0 translate-y-0'}
            `} />
            {/* Ivory Document Fragment */}
            <div className={`absolute w-48 h-64 bg-[var(--ivory)] rounded-lg shadow-xl opacity-0 transform -rotate-6 transition-all duration-[2500ms] ease-[var(--ease-premium)]
              ${animationStage >= 0 ? 'opacity-90 scale-100 -rotate-6 -translate-x-16 -translate-y-4' : 'scale-50 translate-x-0 translate-y-0'}
            `} />
            {/* Second Fragment */}
            <div className={`absolute w-32 h-40 border border-[var(--emerald)] border-opacity-20 bg-transparent rounded-lg opacity-0 transform rotate-45 transition-all duration-[3000ms] ease-[var(--ease-premium)]
              ${animationStage >= 0 ? 'opacity-100 scale-100 rotate-45 translate-x-20 -translate-y-16' : 'scale-50 translate-x-0 translate-y-0'}
            `} />
          </div>
        </div>

        {/* Text Reveal */}
        <div className="relative z-10 flex flex-col items-center">
          <h1 
            className="text-7xl sm:text-9xl font-semibold tracking-tighter text-[var(--emerald)] mb-6 clip-reveal-text"
            style={{ 
              clipPath: animationStage >= 1 ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transition: 'clip-path 1.2s var(--ease-premium)'
            }}
          >
            UNVEIL
          </h1>
          <p 
            className="text-lg sm:text-2xl font-light tracking-[0.2em] uppercase text-[var(--charcoal)] mb-12 transform transition-all duration-1000"
            style={{ 
              opacity: animationStage >= 2 ? 0.8 : 0,
              transform: animationStage >= 2 ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            Every anomaly leaves a signal.
          </p>
          <button
            className="px-8 py-4 bg-[var(--emerald)] text-white rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all duration-1000"
            style={{
              opacity: animationStage >= 2 ? 1 : 0,
              transform: animationStage >= 2 ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            SCAN A DOCUMENT →
          </button>
        </div>
      </div>

      {/* POST-ANIMATION HERO LAYOUT (Stage 3+) */}
      <div 
        className={`relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 px-8 py-20 min-h-screen items-center transition-all duration-1000 ease-[var(--ease-premium)] ${animationStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        {/* Left Column: Copy & CTA */}
        <div className="flex flex-col items-start space-y-8 pointer-events-auto">
          <div className="w-16 h-16">
            <UnveilLogo variant="icon" size={64} />
          </div>
          
          <h2 className="text-5xl sm:text-6xl font-light tracking-tight text-[var(--charcoal)] leading-[1.1]">
            Every anomaly <br/>
            leaves a <span className="font-semibold text-[var(--emerald)] italic">signal.</span>
          </h2>
          
          <p className="text-lg text-[var(--charcoal)] opacity-70 font-light max-w-md leading-relaxed">
            An AI-assisted document security scanner that detects suspicious signals, analyzes evidence, and explains what deserves a closer look.
          </p>
          
          <div className="pt-4">
            <button
              onClick={() => navigate({ to: isAuthenticated ? "/review" : "/login" })}
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-[var(--emerald)] text-white rounded-2xl text-sm font-semibold tracking-widest uppercase overflow-hidden transition-transform hover:-translate-y-1 shadow-[0_4px_20px_rgba(23,74,58,0.15)]"
            >
              <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              SCAN A DOCUMENT →
            </button>
          </div>
        </div>

        {/* Right Column: Premium Document Visual */}
        <div className="relative w-full h-[600px] flex items-center justify-center pointer-events-auto group perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--sage)]/20 to-transparent rounded-[2rem] transform -rotate-3 transition-transform duration-700 group-hover:-rotate-2" />
          
          <div className="relative w-3/4 h-3/4 bg-white rounded-2xl shadow-[0_20px_60px_rgba(41,41,41,0.08)] border border-[var(--charcoal)]/5 overflow-hidden transition-all duration-700 ease-[var(--ease-premium)] group-hover:shadow-[0_30px_80px_rgba(23,74,58,0.12)] group-hover:-translate-y-2">
            
            {/* Fake Document Content */}
            <div className="p-8 h-full flex flex-col space-y-6 opacity-60">
              <div className="w-32 h-32 bg-[var(--sage)]/30 rounded-lg" />
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-[var(--charcoal)]/10 rounded-sm" />
                <div className="h-4 w-1/2 bg-[var(--charcoal)]/10 rounded-sm" />
              </div>
              <div className="space-y-3 pt-6 border-t border-[var(--charcoal)]/5">
                <div className="h-3 w-full bg-[var(--charcoal)]/10 rounded-sm" />
                <div className="h-3 w-5/6 bg-[var(--charcoal)]/10 rounded-sm" />
                <div className="h-3 w-4/6 bg-[var(--charcoal)]/10 rounded-sm" />
              </div>
            </div>

            {/* Hover Interaction Overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {/* Terracotta Point */}
              <div className="absolute top-[35%] left-[25%] w-3 h-3 bg-[var(--terracotta)] rounded-full shadow-[0_0_15px_var(--terracotta)] animate-pulse" />
              
              {/* Connecting Line */}
              <div className="absolute top-[35%] left-[25%] w-48 h-px bg-[var(--terracotta)]/40 origin-left transform rotate-12 transition-all duration-700 delay-100 scale-x-0 group-hover:scale-x-100" />
              
              {/* Ivory Evidence Label */}
              <div className="absolute top-[45%] left-[60%] bg-[var(--ivory)] border border-[var(--terracotta)]/20 shadow-lg px-4 py-2 rounded-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-300">
                <p className="text-xs font-semibold text-[var(--terracotta)] tracking-wider uppercase mb-1">Anomaly Detected</p>
                <p className="text-xs text-[var(--charcoal)]/80">Text alignment inconsistency</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* HOW IT WORKS (Stage 3+) */}
      <div className={`relative z-10 w-full max-w-7xl mx-auto px-8 py-24 transition-all duration-1000 delay-500 ease-[var(--ease-premium)] ${animationStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="flex flex-col items-center text-center mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--charcoal)]/50 mb-3">The Process</p>
          <h3 className="text-3xl font-light text-[var(--charcoal)]">How UNVEIL Works</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Visual Integrity", desc: "Analyzes pixel-level variance and Error Level Analysis (ELA) to detect spliced layers." },
            { title: "Content Consistency", desc: "Cross-references extracted OCR data against known structural and checksum formats." },
            { title: "Manipulation Analysis", desc: "Identifies digital modifications, obscured text, and subtle font inconsistencies." },
            { title: "AI Risk Assessment", desc: "Synthesizes all signals into a comprehensive, human-readable evidence map." }
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(41,41,41,0.04)] border border-[var(--charcoal)]/5 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(23,74,58,0.08)]">
              <div className="w-8 h-8 rounded-full bg-[var(--emerald)]/10 text-[var(--emerald)] flex items-center justify-center text-xs font-bold mb-6">
                0{i + 1}
              </div>
              <h4 className="text-lg font-medium text-[var(--charcoal)] mb-3">{card.title}</h4>
              <p className="text-sm text-[var(--charcoal)]/70 leading-relaxed font-light">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
