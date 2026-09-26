import Tesseract from "tesseract.js";
import type { DocType } from "./id-validators";
import { checkAlignmentConsistency } from "./alignment";

export async function extractFields(imageFile: File): Promise<{
  documentType: DocType;
  extractedFields: {
    name: string | null;
    dob: string | null;
    idNumber: string | null;
    expiryDate: string | null;
  };
  ocrConfidenceScore: number;
  classificationConfidence: "high" | "low"; // high = keyword-backed, low = pattern-only guess
  layoutConsistency: { alignmentScore: number; anomalies: { type: string; description: string }[] };
}> {
  const result = await Tesseract.recognize(imageFile, "eng", {
    logger: (m) => console.log("[OCR]", m.status, Math.round(m.progress * 100) + "%"),
  });

  const data = result.data as any;
  const text: string = data.text;
  const words: any[] = data.words || [];
  const lines: any[] = data.lines || [];

  const ocrConfidenceScore =
    words.length > 0
      ? words.reduce((acc: number, w: any) => acc + w.confidence, 0) / words.length
      : 0;

  const dobMatch = text.match(/(\d{2}[-/.]\d{2}[-/.]\d{4})/);
  const dob = dobMatch ? dobMatch[1] : null;

  // --- Priority-ordered classification -------------------------------
  // Rule: a STRONG signal (a type-specific keyword, e.g. "UIDAI", "Passport",
  // "Election Commission", "Income Tax Department") always wins over a WEAK
  // signal (a generic number-shape regex, which can coincidentally match
  // digits from an unrelated field). Generic patterns are only used as a
  // last-resort fallback, and the Aadhaar 12-digit fallback — the loosest
  // pattern of the four — is tried LAST, not first.

  const panNumberRegex = /\b([A-Z]{5}[0-9]{4}[A-Z])\b/i;
  const passportNumberRegex = /\b([A-PR-WYa-pr-wy][1-9]\d{6})\b/;
  const voterNumberRegex = /\b([A-Z]{3}[0-9]{7})\b/i;
  const aadhaarNumberRegex = /\b\d{4}\s?\d{4}\s?\d{4}\b/;

  const hasAadhaarKeyword = /(aadhaar|uidai|unique identification)/i.test(text);
  const hasPanKeyword = /(income tax department|permanent account number|govt\.? of india)/i.test(text) && panNumberRegex.test(text);
  const hasPassportKeyword = /passport/i.test(text) || /P<[A-Z0-9<]{5,}/.test(text);
  const hasVoterKeyword = /(election commission|epic no|elector'?s? photo)/i.test(text);

  let documentType: DocType = "Unknown";
  let idNumber: string | null = null;
  let classificationConfidence: "high" | "low" = "low";

  // Pass 1 — strong, keyword-backed matches (checked in specificity order)
  if (hasPassportKeyword) {
    documentType = "Passport";
    const m = text.match(passportNumberRegex);
    idNumber = m ? m[1].toUpperCase() : null;
    classificationConfidence = "high";
  } else if (hasPanKeyword) {
    documentType = "PAN";
    const m = text.match(panNumberRegex);
    idNumber = m ? m[1].toUpperCase() : null;
    classificationConfidence = "high";
  } else if (hasVoterKeyword) {
    documentType = "Voter ID";
    const m = text.match(voterNumberRegex);
    idNumber = m ? m[1].toUpperCase() : null;
    classificationConfidence = "high";
  } else if (hasAadhaarKeyword) {
    documentType = "Aadhaar";
    const m = text.match(aadhaarNumberRegex);
    idNumber = m ? m[0].replace(/\s+/g, "") : null;
    classificationConfidence = "high";
  }
  // Pass 2 — no keyword found anywhere; fall back to format-only pattern
  // matches, still in specificity order (most-constrained regex first, the
  // loose generic 12-digit Aadhaar shape absolute last).
  else if (panNumberRegex.test(text)) {
    documentType = "PAN";
    idNumber = text.match(panNumberRegex)![1].toUpperCase();
    classificationConfidence = "low";
  } else if (voterNumberRegex.test(text)) {
    documentType = "Voter ID";
    idNumber = text.match(voterNumberRegex)![1].toUpperCase();
    classificationConfidence = "low";
  } else if (passportNumberRegex.test(text)) {
    documentType = "Passport";
    idNumber = text.match(passportNumberRegex)![1].toUpperCase();
    classificationConfidence = "low";
  } else if (aadhaarNumberRegex.test(text)) {
    documentType = "Aadhaar";
    idNumber = text.match(aadhaarNumberRegex)![0].replace(/\s+/g, "");
    classificationConfidence = "low";
  }

  // --- Name extraction (unchanged heuristic) --------------------------
  let name: string | null = null;
  if (lines.length > 0) {
    const textLines = lines.map((l: any) => (l.text || "").trim()).filter((l: string) => l.length > 0);
    const nameLabelIdx = textLines.findIndex((l: string) => /^(name|father'?s name)/i.test(l));
    if (nameLabelIdx >= 0 && nameLabelIdx + 1 < textLines.length) {
      name = textLines[nameLabelIdx + 1].replace(/^[^:]+:\s*/, "");
    } else {
      let longestUpper = "";
      for (const line of textLines) {
        if (/^[A-Z\s]+$/.test(line) && line.length > longestUpper.length && line.length > 3) {
          longestUpper = line;
        }
      }
      if (longestUpper) name = longestUpper;
    }
  }

  return {
    documentType,
    extractedFields: { name, dob, idNumber, expiryDate: null },
    ocrConfidenceScore,
    classificationConfidence,
    layoutConsistency: checkAlignmentConsistency(lines),
  };
}
