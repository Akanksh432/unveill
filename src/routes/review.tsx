import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { runELA, applyMorphologicalClosing, extractBoundingBoxes, recomputeBoxes } from "@/lib/ela";
import { extractFields } from "@/lib/ocr";
import { validateIdNumber } from "@/lib/id-validators";
import { computeRiskScore } from "@/lib/risk-score";
import { generateForensicReport, downloadFile } from "@/lib/export-report";
import { AppLayout } from "@/components/unveil/AppLayout";
import { Button } from "@/components/ui/button";
import { UploadCloud, CheckCircle2, AlertTriangle, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { RouteGuard } from "@/components/unveil/RouteGuard";

export const Route = createFileRoute("/review")({
  component: ReviewPage,
});

interface Signal {
  id: string;
  type: "normal" | "suspicious";
  x: number;
  y: number;
  title: string;
  explanation: string;
}

interface AnalysisResult {
  score: number;
  originalImage: string;
  signals: Signal[];
  documentType: string;
  classificationConfidence: "high" | "low" | null;
  elaVarianceScore: number | null;
  ocrConfidenceScore: number;
  checksumValid: boolean | null;
  checksumReason: string | null;
  extractedFields: { name: string|null; dob: string|null; idNumber: string|null; expiryDate: string|null };
  heatmapDataUrl: string | null;
  suspiciousBoxes: { x: number; y: number; width: number; height: number }[];
  imageWidth: number | null;
  imageHeight: number | null;
  layoutConsistency: { alignmentScore: number; anomalies: { type: string; description: string }[] };
  rawDiffs: Float32Array | null;
  adaptiveThreshold: number | null;
}

function CircularScore({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let current = 0;
    const i = setInterval(() => {
      current += 1;
      if (current >= score) {
        setDisplayed(score);
        clearInterval(i);
      } else {
        setDisplayed(current);
      }
    }, 15);
    return () => clearInterval(i);
  }, [score]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayed / 100) * circumference;
  const color = score > 70 ? "var(--terracotta)" : "var(--emerald)";

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="var(--charcoal)"
          strokeWidth="2"
          fill="transparent"
          opacity="0.1"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-light tabular-nums" style={{ color }}>{displayed}</span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--charcoal)]/60">Risk Score</span>
      </div>
    </div>
  );
}

function ReviewPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage] = useState<"upload" | "scanning" | "results">("upload");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"original" | "heatmap">("original");
  const [thresholdSlider, setThresholdSlider] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyzeFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file for local forensic analysis.");
      return;
    }
    setStage("scanning");
    
    // Simulate layer separation animation time (3 seconds)
    const scanPromise = new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const ela = await runELA(file);
      
      let suspiciousBoxes: { x: number; y: number; width: number; height: number }[] = [];
      let imageWidth: number | null = null;
      let imageHeight: number | null = null;
      if (ela) {
        imageWidth = ela.width;
        imageHeight = ela.height;
        const closedMask = applyMorphologicalClosing(ela.binaryMask, ela.width, ela.height);
        suspiciousBoxes = extractBoundingBoxes(closedMask, ela.width, ela.height);
      }
      
      const ocr = await extractFields(file);
      
      let checksumValid: boolean | null = null;
      let checksumReason: string | null = null;
      if (ocr.documentType !== "Unknown" && ocr.extractedFields.idNumber) {
        const val = validateIdNumber(ocr.documentType, ocr.extractedFields.idNumber);
        checksumValid = val.valid;
        checksumReason = val.reason;
      }

      const score = computeRiskScore(ela?.varianceScore ?? null, ocr.ocrConfidenceScore, checksumValid, ocr.layoutConsistency.alignmentScore);
      
      const signals: Signal[] = [];
      
      if (checksumValid === false) {
        signals.push({
          id: "sig-1", type: "suspicious", x: 60, y: 30,
          title: "Checksum Validation Failed",
          explanation: `The ID number mathematically fails validation algorithms for ${ocr.documentType}. It was likely fabricated.`
        });
      } else if (checksumValid === true) {
        signals.push({
          id: "sig-1", type: "normal", x: 60, y: 30,
          title: "Format Verified",
          explanation: `The document conforms to standard checksum/format rules for ${ocr.documentType}.`
        });
      }

      if (ela && ela.varianceScore > 50) {
        signals.push({
          id: "sig-2", type: "suspicious", x: 40, y: 60,
          title: "High Error Level Variance",
          explanation: "Inconsistent compression patterns detected, suggesting parts of the image were digitally modified and re-saved."
        });
      }

      if (ocr.ocrConfidenceScore < 45) {
        signals.push({
          id: "sig-3", type: "suspicious", x: 20, y: 40,
          title: "Low OCR Confidence",
          explanation: "OCR confidence was low on this image — could be lighting/angle, not necessarily tampering."
        });
      }

      if (signals.length === 0) {
         signals.push({
          id: "sig-ok", type: "normal", x: 50, y: 50,
          title: "No Anomalies Detected",
          explanation: "The document structure and pixels appear cohesive without signs of tampering."
        });
      }

      await scanPromise;

      setResult({
        score,
        originalImage: URL.createObjectURL(file),
        signals,
        documentType: ocr.documentType,
        classificationConfidence: ocr.classificationConfidence,
        elaVarianceScore: ela?.varianceScore ?? null,
        ocrConfidenceScore: ocr.ocrConfidenceScore,
        checksumValid,
        checksumReason,
        extractedFields: ocr.extractedFields,
        heatmapDataUrl: ela?.heatmapDataUrl ?? null,
        suspiciousBoxes,
        imageWidth,
        imageHeight,
        layoutConsistency: ocr.layoutConsistency,
        rawDiffs: ela?.rawDiffs ?? null,
        adaptiveThreshold: ela?.adaptiveThreshold ?? null
      });
      setStage("results");
      setViewMode("original");
      setThresholdSlider(ela?.adaptiveThreshold ?? null);
    } catch (e) {
      toast.error("Analysis failed.");
      setStage("upload");
    }
  }, []);

  const handleExport = async () => {
    if (!result) return;
    try {
      const blob = await generateForensicReport({
        caseId: `UVL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        operator: "Auditor",
        images: {
          original: result.originalImage,
          heatmap: result.heatmapDataUrl
        },
        classification: result.documentType,
        extracted: result.extractedFields,
        checksumResult: { valid: result.checksumValid, reason: result.checksumReason },
        scores: {
          riskScore: result.score,
          elaVariance: result.elaVarianceScore,
          ocrConfidence: result.ocrConfidenceScore,
          alignmentScore: result.layoutConsistency.alignmentScore
        },
        flags: result.signals.filter(s => s.type === "suspicious").map(s => s.title),
        boxes: result.suspiciousBoxes
      });
      downloadFile(`forensic-report-${Date.now()}.pdf`, blob, "application/pdf");
      toast.success("Report downloaded");
    } catch (e) {
      toast.error("Failed to generate report");
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) analyzeFile(e.dataTransfer.files[0]);
  }, [analyzeFile]);

  return (
    <RouteGuard allowedRoles={["officer", "forensic analyst"]}>
      <AppLayout>
        <div className="w-full flex-1 rounded-3xl overflow-hidden shadow-sm" style={{ background: "var(--sage)" }}>
          <div className="w-full h-full p-2 lg:p-8 flex items-stretch">
            
            {/* Inner Ivory Panel */}
            <div className="w-full flex-1 rounded-2xl relative overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.05)] transition-colors duration-1000" style={{ background: "var(--ivory)" }}>
              
              {stage === "upload" && (
                <div 
                  className={`flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 cursor-pointer ${isDragging ? 'bg-[var(--emerald)]/5' : ''}`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) analyzeFile(e.target.files[0]);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  />
                  <div className={`w-24 h-24 rounded-full border flex items-center justify-center mb-8 transition-all duration-500 ${isDragging ? 'border-[var(--emerald)] bg-[var(--emerald)]/10 scale-110 shadow-lg' : 'border-[var(--charcoal)]/20 bg-[var(--charcoal)]/5'}`}>
                    <UploadCloud className="w-10 h-10 text-[var(--charcoal)]/60" />
                  </div>
                  <h3 className="text-3xl font-light text-[var(--charcoal)] mb-3">Drop document here</h3>
                  <p className="text-[var(--charcoal)]/50 tracking-wider text-sm font-medium uppercase">Or click to browse files (JPEG/PNG)</p>
                </div>
              )}

              {stage === "scanning" && (
                <div className="flex-1 flex items-center justify-center relative perspective-1000">
                  <div className="relative w-64 h-80 animate-scan-layers">
                    {/* Layer 4: Signals */}
                    <div className="absolute inset-0 border border-[var(--terracotta)]/40 rounded-xl bg-[var(--terracotta)]/5 flex items-center justify-center" style={{ transform: "translateZ(60px) translateY(-30px)" }}>
                      <p className="text-[10px] text-[var(--terracotta)] font-bold tracking-widest uppercase">Signal Layer</p>
                    </div>
                    {/* Layer 3: Text */}
                    <div className="absolute inset-0 border border-[var(--charcoal)]/20 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center" style={{ transform: "translateZ(40px) translateY(-20px)" }}>
                      <p className="text-[10px] text-[var(--charcoal)]/60 font-bold tracking-widest uppercase">Text Layer</p>
                    </div>
                    {/* Layer 2: Visual */}
                    <div className="absolute inset-0 border border-[var(--emerald)]/20 rounded-xl bg-[var(--emerald)]/5 flex items-center justify-center overflow-hidden" style={{ transform: "translateZ(20px) translateY(-10px)" }}>
                      <p className="text-[10px] text-[var(--emerald)]/60 font-bold tracking-widest uppercase">Visual Layer</p>
                      {/* Emerald Inspection Lens */}
                      <div className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-[var(--emerald)]/20 to-transparent skew-x-12 animate-lens-sweep" />
                    </div>
                    {/* Layer 1: Document */}
                    <div className="absolute inset-0 border border-[var(--charcoal)]/10 rounded-xl bg-white flex items-center justify-center shadow-2xl" style={{ transform: "translateZ(0)" }}>
                      <p className="text-[10px] text-[var(--charcoal)]/40 font-bold tracking-widest uppercase">Original</p>
                    </div>
                  </div>
                  <style>{`
                    @keyframes scan-layers {
                      0%, 100% { transform: rotateX(20deg) rotateY(-10deg) scale(0.9); }
                      50% { transform: rotateX(30deg) rotateY(10deg) scale(1); }
                    }
                    @keyframes lens-sweep {
                      0% { transform: translateX(-150%) skewX(12deg); }
                      100% { transform: translateX(250%) skewX(12deg); }
                    }
                    .animate-scan-layers {
                      animation: scan-layers 3s ease-in-out infinite;
                      transform-style: preserve-3d;
                    }
                    .animate-lens-sweep {
                      animation: lens-sweep 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    }
                  `}</style>
                  <div className="absolute bottom-16 text-[var(--charcoal)]/50 tracking-widest uppercase text-xs font-semibold animate-pulse">
                    Isolating Document Layers...
                  </div>
                </div>
              )}

              {stage === "results" && result && (
                <div className="flex-1 flex flex-col lg:flex-row items-stretch animate-fade-up">
                  {/* Left Side: Document Map */}
                  <div className="flex-1 p-8 flex items-center justify-center relative bg-[var(--charcoal)]/5 border-r border-[var(--charcoal)]/5">
                    
                    {/* View Toggle & Controls */}
                    <div className="absolute top-8 left-8 z-30 flex flex-col gap-2 bg-white/80 backdrop-blur-md p-2 rounded-lg border border-[var(--charcoal)]/10 shadow-sm">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setViewMode("original")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'original' ? 'bg-[var(--charcoal)] text-white' : 'text-[var(--charcoal)]/60 hover:text-[var(--charcoal)]'}`}
                        >
                          Original
                        </button>
                        <div title={result.heatmapDataUrl === null ? "ELA not available — source is not a JPEG" : undefined}>
                          <button 
                            onClick={() => { if (result.heatmapDataUrl) setViewMode("heatmap"); }}
                            disabled={!result.heatmapDataUrl}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'heatmap' ? 'bg-[var(--charcoal)] text-white' : 'text-[var(--charcoal)]/60 hover:text-[var(--charcoal)]'} ${!result.heatmapDataUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            ELA Heatmap
                          </button>
                        </div>
                      </div>
                      
                      {viewMode === "heatmap" && result.rawDiffs && result.adaptiveThreshold !== null && (
                        <div className="px-1 pt-2 pb-1 flex flex-col gap-1 border-t border-[var(--charcoal)]/10">
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-[var(--charcoal)]/60">
                            <span>Threshold: {Math.round(thresholdSlider ?? result.adaptiveThreshold)}</span>
                            {thresholdSlider !== result.adaptiveThreshold && (
                              <button onClick={() => {
                                setThresholdSlider(result.adaptiveThreshold);
                                if (result.rawDiffs && result.imageWidth && result.imageHeight && result.adaptiveThreshold !== null) {
                                  setResult({ ...result, suspiciousBoxes: recomputeBoxes(result.rawDiffs, result.imageWidth, result.imageHeight, result.adaptiveThreshold) });
                                }
                              }} className="text-[var(--emerald)] hover:underline">Reset</button>
                            )}
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max={Math.max(100, Math.round(result.adaptiveThreshold * 2.5))}
                            value={thresholdSlider ?? result.adaptiveThreshold} 
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setThresholdSlider(v);
                              if (result.rawDiffs && result.imageWidth && result.imageHeight) {
                                const newBoxes = recomputeBoxes(result.rawDiffs, result.imageWidth, result.imageHeight, v);
                                setResult({ ...result, suspiciousBoxes: newBoxes });
                              }
                            }}
                            className="w-full accent-[var(--charcoal)]"
                          />
                        </div>
                      )}
                    </div>

                    <div className={`relative max-w-full max-h-full transition-all duration-700 ${selectedSignal ? 'opacity-40 grayscale-[50%]' : 'opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)]'}`}>
                      <img src={viewMode === "heatmap" && result.heatmapDataUrl ? result.heatmapDataUrl : result.originalImage} alt="Document" className="rounded-xl max-w-full max-h-[70vh] object-contain" />
                      
                      {/* Suspicious Bounding Boxes */}
                      {viewMode === "heatmap" && result.imageWidth && result.imageHeight && result.suspiciousBoxes.map((box, idx) => (
                        <div
                          key={`box-${idx}`}
                          className="absolute border-[3px] border-[var(--terracotta)] bg-[var(--terracotta)]/10 z-10 shadow-[0_0_15px_rgba(201,111,82,0.5)] rounded-sm pointer-events-none transition-all duration-500 animate-pulse"
                          style={{
                            left: `${(box.x / result.imageWidth!) * 100}%`,
                            top: `${(box.y / result.imageHeight!) * 100}%`,
                            width: `${(box.width / result.imageWidth!) * 100}%`,
                            height: `${(box.height / result.imageHeight!) * 100}%`
                          }}
                        />
                      ))}
                      
                      {/* Signal Dots */}
                      {result.signals.map(s => {
                        const isSuspicious = s.type === "suspicious";
                        const color = isSuspicious ? "var(--terracotta)" : "var(--emerald)";
                        const isActive = selectedSignal === s.id;
                        return (
                          <div
                            key={s.id}
                            className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full cursor-pointer transition-all duration-500 flex items-center justify-center ${isActive ? 'scale-150 z-20' : 'hover:scale-125 z-10'}`}
                            style={{ top: `${s.y}%`, left: `${s.x}%` }}
                            onClick={() => setSelectedSignal(isActive ? null : s.id)}
                          >
                            <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: color }} />
                            <div className="relative w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: color }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Side: Evidence Panel */}
                  <div className="w-full lg:w-[400px] p-8 flex flex-col bg-[var(--ivory)] overflow-y-auto">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--charcoal)]/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--charcoal)]/50 mb-1">Risk Assessment</span>
                        <h2 className="text-2xl font-light text-[var(--charcoal)] mb-2">Evidence Map</h2>
                        {result.classificationConfidence === "low" && (
                          <span className="text-[10px] uppercase tracking-wider text-[var(--terracotta)] font-medium">Low-confidence classification ({result.documentType})</span>
                        )}
                      </div>
                      <CircularScore score={result.score} />
                    </div>

                    <div className="space-y-4 mb-8">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--charcoal)]/50 mb-2">Document Details</p>
                      <div className="p-4 rounded-xl border border-[var(--charcoal)]/10 bg-white/50 space-y-4">
                        <div className="flex justify-between items-center border-b border-[var(--charcoal)]/5 pb-2">
                          <span className="text-xs text-[var(--charcoal)]/60 font-medium">Type</span>
                          <span className="text-xs font-semibold px-2 py-1 bg-[var(--emerald)]/10 text-[var(--emerald)] rounded-md">
                            {result.documentType}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--charcoal)]/50 font-semibold">Extracted Fields</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex flex-col">
                              <span className="text-[var(--charcoal)]/50">Name</span>
                              <span className="font-medium truncate" title={result.extractedFields.name || ""}>{result.extractedFields.name || "Not detected"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[var(--charcoal)]/50">DOB</span>
                              <span className="font-medium">{result.extractedFields.dob || "Not detected"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[var(--charcoal)]/50">ID Number</span>
                              <span className="font-medium truncate" title={result.extractedFields.idNumber || ""}>{result.extractedFields.idNumber || "Not detected"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[var(--charcoal)]/50">Expiry</span>
                              <span className="font-medium">{result.extractedFields.expiryDate || "Not detected"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--charcoal)]/50 mb-2">Forensic Sub-Scores</p>
                      
                      <div className="p-4 rounded-xl border border-[var(--charcoal)]/10 bg-white/50 flex justify-between items-center hover:bg-white/80 transition-colors">
                        <span className="text-sm font-semibold text-[var(--charcoal)]">ELA Variance</span>
                        <span className="text-sm font-bold font-mono">
                          {result.elaVarianceScore !== null ? result.elaVarianceScore.toFixed(1) : "N/A — not a JPEG"}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-[var(--charcoal)]/10 bg-white/50 flex justify-between items-center hover:bg-white/80 transition-colors">
                        <span className="text-sm font-semibold text-[var(--charcoal)]">OCR Confidence</span>
                        <span className="text-sm font-bold font-mono">
                          {Math.round(result.ocrConfidenceScore)}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-[var(--charcoal)]/10 bg-white/50 flex flex-col justify-center gap-1 hover:bg-white/80 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-[var(--charcoal)]">Checksum / Format</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                            result.checksumValid === true ? 'bg-[var(--emerald)]/10 text-[var(--emerald)]' :
                            result.checksumValid === false ? 'bg-[var(--terracotta)]/10 text-[var(--terracotta)]' :
                            'bg-[var(--charcoal)]/10 text-[var(--charcoal)]'
                          }`}>
                            {result.checksumValid === true ? "Valid" : result.checksumValid === false ? "Invalid" : "Not applicable"}
                          </span>
                        </div>
                        {result.checksumReason && (
                          <span className="text-[10px] text-[var(--charcoal)]/60 mt-1">{result.checksumReason}</span>
                        )}
                      </div>

                      <div className="p-4 rounded-xl border border-[var(--charcoal)]/10 bg-white/50 flex flex-col justify-center gap-1 hover:bg-white/80 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-[var(--charcoal)]">Layout Consistency Check</span>
                          <span className="text-sm font-bold font-mono">
                            {result.layoutConsistency.alignmentScore}/100
                          </span>
                        </div>
                        {result.layoutConsistency.anomalies.length > 0 ? (
                          <span className="text-[10px] text-[var(--terracotta)] mt-1">
                            {result.layoutConsistency.anomalies.length} anomal{result.layoutConsistency.anomalies.length === 1 ? 'y' : 'ies'} detected
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--emerald)] mt-1">Consistent word height</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--charcoal)]/50 mb-2">Signals Detected</p>
                      
                      {result.signals.map((s) => {
                        const isSuspicious = s.type === "suspicious";
                        const isActive = selectedSignal === s.id;
                        return (
                          <div 
                            key={s.id}
                            onClick={() => setSelectedSignal(isActive ? null : s.id)}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all duration-500 ${isActive ? 'shadow-lg -translate-x-2 bg-white' : 'hover:bg-white/50'} ${isSuspicious ? (isActive ? 'border-[var(--terracotta)]/40' : 'border-[var(--terracotta)]/10') : (isActive ? 'border-[var(--emerald)]/40' : 'border-[var(--emerald)]/10')}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                {isSuspicious ? <AlertTriangle className="w-4 h-4 text-[var(--terracotta)]" /> : <CheckCircle2 className="w-4 h-4 text-[var(--emerald)]" />}
                                <h4 className={`text-sm font-semibold tracking-wide ${isSuspicious ? 'text-[var(--terracotta)]' : 'text-[var(--emerald)]'}`}>{s.title}</h4>
                              </div>
                              {isActive ? <X className="w-4 h-4 text-[var(--charcoal)]/40" /> : <ArrowRight className="w-4 h-4 text-[var(--charcoal)]/20" />}
                            </div>
                            
                            <div className={`overflow-hidden transition-all duration-500 ${isActive ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                              <p className="text-xs text-[var(--charcoal)]/80 leading-relaxed font-medium">
                                <span className="text-[10px] uppercase tracking-wider text-[var(--charcoal)]/50 block mb-1">Why it matters</span>
                                {s.explanation}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-auto pt-8 flex gap-3">
                      <Button onClick={() => {setStage("upload"); setResult(null); setSelectedSignal(null); setViewMode("original");}} className="flex-1 rounded-xl bg-[var(--charcoal)]/5 text-[var(--charcoal)] hover:bg-[var(--charcoal)]/10 shadow-none border-0">
                        Scan Another Document
                      </Button>
                      <Button onClick={handleExport} className="flex-1 rounded-xl bg-[var(--charcoal)] text-white hover:bg-[var(--charcoal)]/90 shadow-none border-0">
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </AppLayout>
    </RouteGuard>
  );
}
