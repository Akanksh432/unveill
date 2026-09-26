import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { runELA } from "@/lib/ela";
import { extractFields } from "@/lib/ocr";
import { validateIdNumber } from "@/lib/id-validators";
import { computeRiskScore } from "@/lib/risk-score";
import { AppLayout, PageHeader } from "@/components/unveil/AppLayout";
import { RiskBadge } from "@/components/unveil/RiskBadge";
import { NeuralFraudScanLoader } from "@/components/unveil/NeuralFraudScanLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  UploadCloud, FileText, AlertTriangle, CheckCircle2,
  FileBarChart, Loader2, ShieldOff, ScanLine, Layers,
} from "lucide-react";
import { analyzedDocuments } from "@/lib/sample-data";
import { useApp, matchesSearch } from "@/lib/app-context";
import { downloadFile, generateForensicReport } from "@/lib/export-report";
import { toast } from "sonner";
import { validateFile } from "@/lib/file-validation";
import { RouteGuard } from "@/components/unveil/RouteGuard";

export const Route = createFileRoute("/review")({
  component: ReviewPage,
});

interface AnalysisResult {
  tamperScore: number;
  flags: string[];
  reasons: string[];
  fileName: string;
  fileSize: number;
  fileType: string;
  analyzedAt: string;
  elaVarianceScore: number | null;
  elaHeatmapUrl: string | null;
  originalImageUrl: string | null;
  checksumValid?: boolean | null;
  checksumReason?: string | null;
  ocrConfidence?: number;
  ocrFields?: {
    name: string | null;
    dob: string | null;
    idNumber: string | null;
    expiryDate: string | null;
  };
}

interface UploadEntry {
  id: string;
  name: string;
  status: "Analyzing" | "Verified" | "Flagged";
  progress: number;
}

// Animated Score Bar
function AnimatedScoreBar({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    setDisplayed(0);
    const start = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * score));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#22c55e";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Tamper Score
        </p>
        <p
          className="text-5xl font-extralight tabular-nums"
          style={{ color: "#D4AF37", textShadow: "0 0 30px rgba(212,175,55,0.4)" }}
        >
          {displayed}
          <span className="text-lg text-muted-foreground/50 font-light">/100</span>
        </p>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden bg-white/5 border border-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${displayed}%`,
            background: `linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%)`,
            backgroundSize: "100vw 100%",
            boxShadow: `0 0 12px ${color}80`,
          }}
        />
        <div
          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
          style={{ left: `calc(${displayed}% - 16px)` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
        <span>Cohesive</span><span>Suspicious</span><span>High Fraud Probability</span>
      </div>
    </div>
  );
}

// Awaiting Empty State
function AwaitingDocument() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[340px] gap-5 px-8 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary/30" />
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10"
          style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}
        >
          <ShieldOff className="h-8 w-8 text-muted-foreground/40" />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-light tracking-tight" style={{ color: "rgba(212,175,55,0.7)" }}>
          Awaiting Document
        </p>
        <p className="text-sm text-muted-foreground max-w-[220px] leading-relaxed">
          Upload a PDF or image to begin the AI-powered tamper analysis.
        </p>
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-[0.025]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="absolute left-0 right-0 border-t border-white" style={{ top: `${(i + 1) * 12.5}%` }} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="absolute top-0 bottom-0 border-l border-white" style={{ left: `${(i + 1) * 16.66}%` }} />
        ))}
      </div>
    </div>
  );
}

// Staggered Flag Item
function FlagItem({ text, index }: { text: string; index: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 180 + 100);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <li
      className="flex items-start gap-3 rounded-2xl p-4 text-sm"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 0.5s ease ${index * 0.18}s, transform 0.5s ease ${index * 0.18}s, box-shadow 0.5s ease`,
        borderColor: "rgba(220,38,38,0.2)",
        border: "1px solid rgba(220,38,38,0.2)",
        background: "rgba(220,38,38,0.04)",
        boxShadow: visible ? "0 0 15px rgba(220,38,38,0.2)" : "none",
      }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "rgba(252,165,165,0.8)" }} />
      <span className="text-foreground/90 tracking-wide">{text}</span>
    </li>
  );
}

// Doc Status Row
function DocStatus({ entry }: { entry: UploadEntry }) {
  const map = {
    Verified: { icon: CheckCircle2, cls: "text-emerald-400", label: "text-emerald-400" },
    Analyzing: { icon: Loader2, cls: "text-amber-400 animate-spin", label: "text-amber-400" },
    Flagged: { icon: AlertTriangle, cls: "text-red-400", label: "text-red-400" },
  } as const;
  const { icon: Icon, cls, label } = map[entry.status];
  return (
    <div className="rounded-2xl border border-white/[0.06] px-4 py-3 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.2)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 truncate min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-medium text-foreground">{entry.name}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase shrink-0 ml-2 ${label}`}>
          <Icon className={`h-3.5 w-3.5 ${cls}`} />
          {entry.status}
        </div>
      </div>
      {entry.status === "Analyzing" && (
        <div className="mt-2.5 h-0.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${entry.progress}%`,
              background: "linear-gradient(90deg, #D4AF37, #E5C158)",
              boxShadow: "0 0 8px rgba(212,175,55,0.6)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

// Main Page
function ReviewPage() {
  const { openDoc, search } = useApp();
  const [docs, setDocs] = useState(analyzedDocuments);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);

  const checkRateLimit = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/rate-limit");
      if (res.status === 429) { toast.error("Rate limit exceeded. Please wait."); return false; }
      return true;
    } catch {
      const now = Date.now();
      const lastReset = parseInt(localStorage.getItem("rl_reset") || "0", 10);
      let count = parseInt(localStorage.getItem("rl_count") || "0", 10);
      if (now > lastReset) { count = 0; localStorage.setItem("rl_reset", String(now + 60000)); }
      if (count >= 10) { toast.error("Rate limit exceeded. Please wait."); return false; }
      localStorage.setItem("rl_count", String(count + 1));
      return true;
    }
  };

  const analyzeFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const allowed = await checkRateLimit();
    if (!allowed) return;

    const validFiles: File[] = [];
    for (const f of arr) {
      const v = await validateFile(f);
      if (!v.valid) { toast.error(`Invalid file: ${f.name}`, { description: v.error }); }
      else { validFiles.push(f); }
    }
    if (validFiles.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    for (const f of validFiles) {
      const entryId = crypto.randomUUID();
      setUploads((prev) => [{ id: entryId, name: f.name, status: "Analyzing", progress: 15 }, ...prev]);

      try {
        const progressInterval = setInterval(() => {
          setUploads((prev) =>
            prev.map((u) => u.id === entryId && u.progress < 88
              ? { ...u, progress: u.progress + Math.random() * 10 }
              : u
            )
          );
        }, 600);

        let score = 0;
        let flags: string[] = [];
        let reasons: string[] = [];
        let elaResult = null;
        let checksumValid: boolean | null = null;
        let checksumReason: string | null = null;
        let ocrFields = null;
        let ocrConfidence = 0;

        if (f.type.startsWith("image/")) {
          // Client-side flow for images
          try { elaResult = await runELA(f); } catch (e) { console.error("ELA failed", e); }
          
          try {
            const ocr = await extractFields(f);
            ocrFields = ocr.extractedFields;
            ocrConfidence = ocr.ocrConfidenceScore;

            if (ocr.documentType !== "Unknown" && ocr.extractedFields.idNumber) {
              const val = validateIdNumber(ocr.documentType, ocr.extractedFields.idNumber);
              checksumValid = val.valid;
              checksumReason = val.reason;
              
              if (val.valid === false) {
                flags.push("Checksum Invalid");
                reasons.push(val.reason);
              }
            } else if (ocr.documentType === "Unknown") {
              flags.push("Unrecognized Document");
              reasons.push("Could not determine document type or find ID number via OCR.");
            }
          } catch (e) {
            console.error("OCR failed", e);
          }

          if (elaResult && elaResult.varianceScore > 60) {
            flags.push("High ELA Variance");
            reasons.push(`ELA detected unusually high pixel variance (${elaResult.varianceScore}/100), indicating possible digital manipulation.`);
          }
          
          score = computeRiskScore(elaResult?.varianceScore ?? null, ocrConfidence, checksumValid);

        } else {
          // Server-side flow for PDFs
          const formData = new FormData();
          formData.append("file", f);
          const res = await fetch("/api/analyze-document", { method: "POST", body: formData });
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          const data = await res.json();
          score = data.tamperScore ?? 0;
          flags = data.flags ?? [];
          reasons = data.reasons ?? flags;
        }

        clearInterval(progressInterval);

        const result: AnalysisResult = {
          tamperScore: score,
          flags,
          reasons,
          fileName: f.name,
          fileSize: f.size,
          fileType: f.type,
          analyzedAt: new Date().toLocaleString(),
          elaVarianceScore: elaResult?.varianceScore ?? null,
          elaHeatmapUrl: elaResult?.heatmapDataUrl ?? null,
          originalImageUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
          checksumValid,
          checksumReason,
          ocrConfidence,
          ocrFields: ocrFields ?? undefined,
        };

        setAnalysisResult(result);
        setUploads((prev) =>
          prev.map((u) => u.id === entryId ? { ...u, progress: 100, status: score > 40 ? "Flagged" : "Verified" } : u)
        );
        toast.success(`Analysis complete for ${f.name}`);

        const newDoc = {
          id: `DOC-${Math.floor(Math.random() * 9000) + 1000}`,
          name: f.name,
          type: f.type.includes("pdf") ? "PDF Document" : "Image Document",
          applicationId: "APP-NEW",
          uploaded: new Date().toISOString().split("T")[0],
          tamperScore: score,
          risk: (score > 70 ? "High" : score > 40 ? "Medium" : "Low") as "High" | "Medium" | "Low",
          reasons,
        };
        setDocs((prev) => [newDoc, ...prev]);
      } catch (err: any) {
        toast.error(`Analysis failed for ${f.name}`, { description: err.message });
        setUploads((prev) => prev.map((u) => u.id === entryId ? { ...u, status: "Flagged", progress: 100 } : u));
      }
    }
    setIsAnalyzing(false);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) analyzeFiles(e.dataTransfer.files);
  }, [analyzeFiles]);

  const filtered = docs.filter((d) => matchesSearch(search, d.id, d.name, d.type, d.applicationId, d.risk));

  const generateReport = async () => {
    if (!analysisResult) { toast.error("No analysis to export yet."); return; }
    
    // Determine classification from OCR or fallback
    let classification = "Unknown";
    if (analysisResult.ocrFields && analysisResult.ocrFields.idNumber) {
      if (analysisResult.fileName.toLowerCase().includes("aadhaar")) classification = "Aadhaar";
      else if (analysisResult.fileName.toLowerCase().includes("pan")) classification = "PAN";
      else if (analysisResult.fileName.toLowerCase().includes("passport")) classification = "Passport";
      else if (analysisResult.fileName.toLowerCase().includes("voter")) classification = "Voter ID";
    }

    const content = await generateForensicReport({
      caseId: `UNV-${Math.floor(Math.random() * 9000) + 1000}-X`,
      timestamp: analysisResult.analyzedAt,
      operator: "Op-114",
      images: {
        original: analysisResult.originalImageUrl || "",
        heatmap: analysisResult.elaHeatmapUrl
      },
      classification,
      extracted: {
        name: analysisResult.ocrFields?.name || null,
        dob: analysisResult.ocrFields?.dob || null,
        idNumber: analysisResult.ocrFields?.idNumber || null,
      },
      checksumResult: {
        valid: analysisResult.checksumValid ?? null,
        reason: analysisResult.checksumReason ?? "No checksum algorithm available or executed."
      },
      scores: {
        riskScore: analysisResult.tamperScore,
        elaVariance: analysisResult.elaVarianceScore,
        ocrConfidence: analysisResult.ocrConfidence || 0,
        checksumScore: analysisResult.checksumValid === false ? 100 : 0
      },
      flags: analysisResult.reasons
    });
    
    downloadFile(`unveil-audit-${Date.now()}.pdf`, content, "application/pdf");
    toast.success("Report downloaded");
  };

  return (
    <RouteGuard allowedRoles={["officer", "forensic analyst"]}>
      <AppLayout>
        <style>{`
          @keyframes flag-glow-pulse {
            0%, 100% { box-shadow: 0 0 8px rgba(220,38,38,0.1); opacity: 1; }
            50% { box-shadow: 0 0 18px rgba(220,38,38,0.3); }
          }
          .drop-zone-dragging {
            border-color: rgba(212,175,55,0.55) !important;
            background: rgba(212,175,55,0.06) !important;
            box-shadow: 0 0 50px rgba(212,175,55,0.18), inset 0 0 60px rgba(212,175,55,0.05);
          }
          .flag-chip {
            animation: flag-glow-pulse 2.5s ease-in-out infinite;
          }
        `}</style>

        <PageHeader
          title="Document Review"
          description="Upload, scan, and verify applicant documents for tampering and inconsistencies."
          actions={
            <Button
              size="sm"
              onClick={generateReport}
              disabled={isAnalyzing || !analysisResult}
              style={analysisResult ? {
                background: "linear-gradient(135deg, #D4AF37, #B8960C)",
                color: "#09090B",
                boxShadow: "0 0 20px rgba(212,175,55,0.3)",
                fontWeight: 600,
              } : undefined}
            >
              <FileBarChart className="mr-2 h-4 w-4" />Generate Report
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Upload Zone */}
          <div
            className={`glass-card lg:col-span-1 animate-fade-up overflow-hidden cursor-pointer transition-all duration-500 ${isDragging ? "drop-zone-dragging" : "border-primary/15 hover:border-primary/30"}`}
            style={{ animationDelay: "0.1s", borderStyle: "dashed", borderWidth: "1px" }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isAnalyzing && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) analyzeFiles(e.target.files);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />

            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-3xl border transition-all duration-500"
                style={{
                  borderColor: isDragging ? "rgba(212,175,55,0.6)" : "rgba(212,175,55,0.2)",
                  background: isDragging ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.06)",
                  boxShadow: isDragging ? "0 0 50px rgba(212,175,55,0.35)" : "0 0 24px rgba(212,175,55,0.1)",
                  transform: isDragging ? "scale(1.1)" : "scale(1)",
                }}
              >
                <UploadCloud className="h-7 w-7" style={{ color: "#D4AF37" }} />
              </div>

              <p className="mt-5 text-sm font-medium tracking-wide text-foreground">
                {isDragging ? "Release to analyze" : "Drop PDF or image files"}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground tracking-wide">
                Supported: PDF, JPG, PNG · Max 10MB per file
              </p>

              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                disabled={isAnalyzing}
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                style={{ borderColor: "rgba(212,175,55,0.3)", color: "#D4AF37" }}
              >
                Browse files
              </Button>

              {uploads.length > 0 && (
                <div className="mt-6 w-full space-y-2 text-left">
                  {uploads.slice(0, 6).map((u) => <DocStatus key={u.id} entry={u} />)}
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div
            className="glass-card lg:col-span-2 animate-fade-up relative overflow-hidden"
            style={{ animationDelay: "0.2s" }}
          >
            {isAnalyzing ? (
              <div className="p-6">
                <NeuralFraudScanLoader />
              </div>
            ) : analysisResult ? (
              <>
                {/* Header */}
                <div
                  className="flex flex-row items-start justify-between pb-5 px-6 pt-6"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ScanLine className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(212,175,55,0.7)" }} />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Live Analysis</p>
                    </div>
                    <p className="text-xl font-light tracking-tight text-foreground truncate max-w-[360px]">
                      {analysisResult.fileName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground tracking-wide">
                      Analyzed {analysisResult.analyzedAt} · {(analysisResult.fileSize / 1024).toFixed(1)} KB ·{" "}
                      {analysisResult.fileType.includes("pdf") ? "PDF Document" : "Image Document"}
                    </p>
                  </div>
                  <div className="shrink-0 ml-4">
                    <RiskBadge level={analysisResult.tamperScore > 70 ? "High" : analysisResult.tamperScore > 40 ? "Medium" : "Low"} />
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-8 px-6 pt-6 pb-6">
                  <AnimatedScoreBar score={analysisResult.tamperScore} />

                  {analysisResult.flags.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">Detection Flags</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.flags.map((flag, i) => (
                          <span
                            key={i}
                            className="flag-chip px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                            style={{
                              background: "rgba(220,38,38,0.08)",
                              border: "1px solid rgba(220,38,38,0.25)",
                              color: "#fca5a5",
                              animationDelay: `${i * 0.3}s`,
                            }}
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.reasons.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">Suspicious Findings</p>
                      <ul className="space-y-2">
                        {analysisResult.reasons.map((r, i) => <FlagItem key={i} text={r} index={i} />)}
                      </ul>
                    </div>
                  )}

                  {analysisResult.fileType.startsWith("image/") && (
                    <div className="mt-6 border-t border-white/[0.06] pt-6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">Error Level Analysis</p>
                      {analysisResult.elaVarianceScore !== null ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                             <span className="text-xs text-muted-foreground">Variance Score:</span>
                             <span className="text-lg font-medium text-foreground">{analysisResult.elaVarianceScore}/100</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 rounded-xl overflow-hidden border border-white/10 relative group">
                              <p className="absolute top-2 left-2 z-10 text-[9px] uppercase tracking-wider bg-black/50 text-white px-2 py-1 rounded">Original</p>
                              <img src={analysisResult.originalImageUrl!} alt="Original" className="w-full h-auto object-contain bg-black/20 max-h-64" />
                            </div>
                            <div className="flex-1 rounded-xl overflow-hidden border border-white/10 relative group">
                              <p className="absolute top-2 left-2 z-10 text-[9px] uppercase tracking-wider bg-black/50 text-white px-2 py-1 rounded">ELA Heatmap</p>
                              <img src={analysisResult.elaHeatmapUrl!} alt="Heatmap" className="w-full h-auto object-contain bg-black/20 max-h-64" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground p-4 bg-white/5 rounded-lg border border-white/[0.06]">
                          ELA not applicable — source is not a JPEG (no compression artifacts to analyze).
                        </p>
                      )}
                    </div>
                  )}

                  {/* Metadata strip */}
                  <div
                    className="rounded-2xl border p-4 grid grid-cols-3 gap-4"
                    style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}
                  >
                    {[
                      { label: "File Size", value: `${(analysisResult.fileSize / 1024).toFixed(1)} KB` },
                      { label: "Format", value: (analysisResult.fileType.split("/")[1] || "UNKNOWN").toUpperCase() },
                      { label: "Risk Level", value: analysisResult.tamperScore > 70 ? "HIGH" : analysisResult.tamperScore > 40 ? "MEDIUM" : "LOW" },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 font-medium">{label}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  {analysisResult.checksumValid !== undefined && analysisResult.checksumReason && (
                    <div className="rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: analysisResult.checksumValid === false ? "rgba(220,38,38,0.3)" : "rgba(34,197,94,0.3)", background: "rgba(0,0,0,0.2)" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">ID Checksum & OCR</span>
                        {analysisResult.checksumValid === true && <span className="text-[10px] px-2 py-0.5 rounded-sm font-bold bg-emerald-500/10 text-emerald-400">PASSED</span>}
                        {analysisResult.checksumValid === false && <span className="text-[10px] px-2 py-0.5 rounded-sm font-bold bg-red-500/10 text-red-400">FAILED</span>}
                        {analysisResult.checksumValid === null && <span className="text-[10px] px-2 py-0.5 rounded-sm font-bold bg-amber-500/10 text-amber-400">FORMAT ONLY</span>}
                      </div>
                      <p className="text-sm text-foreground/80">{analysisResult.checksumReason}</p>
                      {analysisResult.ocrFields?.idNumber && (
                        <p className="text-xs text-muted-foreground mt-1">Detected ID: <span className="font-mono text-foreground">{analysisResult.ocrFields.idNumber}</span></p>
                      )}
                    </div>
                  )}

                  {/* Disclaimer strip */}
                  <div className="mt-4 border-t border-white/[0.06] pt-4">
                    <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed text-center">
                      UNVEIL assists forensic evaluation. Flagged anomalies indicate statistical and mathematical variance, not a definitive legal ruling.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={generateReport}
                      style={{
                        background: "linear-gradient(135deg, #D4AF37, #B8960C)",
                        color: "#09090B",
                        fontWeight: 600,
                        boxShadow: "0 0 20px rgba(212,175,55,0.25)",
                      }}
                    >
                      <FileBarChart className="mr-2 h-4 w-4" />Export Report
                    </Button>
                    <Button size="sm" variant="outline" style={{ borderColor: "rgba(255,255,255,0.1)" }} onClick={() => toast("Escalated to senior forensic analyst")}>
                      Escalate
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative h-full">
                <AwaitingDocument />
              </div>
            )}
          </div>
        </div>

        {/* Document History Table */}
        <Card className="mt-8 glass-card animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader
            className="flex flex-row items-center justify-between pb-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}
              >
                <Layers className="h-4 w-4" style={{ color: "#D4AF37" }} />
              </div>
              <CardTitle className="text-lg font-light tracking-tight text-foreground">Recently analyzed documents</CardTitle>
            </div>
            <span
              className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-3 py-1.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {filtered.length} of {docs.length}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Tamper Score</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow
                    key={d.id}
                    className="premium-table-row cursor-pointer transition-all duration-300 hover:bg-primary/[0.03]"
                    onClick={() => openDoc(d.id)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{d.id}</TableCell>
                    <TableCell className="font-medium text-foreground">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.type}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{d.applicationId}</TableCell>
                    <TableCell className="text-muted-foreground">{d.uploaded}</TableCell>
                    <TableCell
                      className="text-right tabular-nums font-light"
                      style={{
                        color: d.tamperScore >= 70 ? "#ef4444" : d.tamperScore >= 40 ? "#f59e0b" : "#22c55e",
                      }}
                    >
                      {d.tamperScore}
                    </TableCell>
                    <TableCell><RiskBadge level={d.risk} /></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No documents match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AppLayout>
    </RouteGuard>
  );
}
