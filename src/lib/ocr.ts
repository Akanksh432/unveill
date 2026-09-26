import Tesseract from "tesseract.js";
import type { DocType } from "./id-validators";

export async function extractFields(imageFile: File): Promise<{
  documentType: DocType;
  extractedFields: {
    name: string | null;
    dob: string | null;
    idNumber: string | null;
    expiryDate: string | null;
  };
  ocrConfidenceScore: number;
}> {
  // 1. Tesseract OCR
  const result = await Tesseract.recognize(imageFile, "eng", {
    logger: (m) => console.log("[OCR]", m.status, Math.round(m.progress * 100) + "%"),
  });
  
  const data = result.data as any;
  const text: string = data.text;
  const words: any[] = data.words || [];
  const lines: any[] = data.lines || [];
  
  // 4. Calculate OCR Confidence
  const ocrConfidenceScore = words.length > 0
    ? words.reduce((acc: number, w: any) => acc + w.confidence, 0) / words.length
    : 0;

  let documentType: DocType = "Unknown";
  let name: string | null = null;
  let dob: string | null = null;
  let idNumber: string | null = null;
  let expiryDate: string | null = null;

  // DOB Extractor
  const dobMatch = text.match(/(\d{2}[-/\.]\d{2}[-/\.]\d{4})/);
  if (dobMatch) dob = dobMatch[1];

  // 2 & 3. Document-type heuristics and field extraction
  
  // Aadhaar
  if (/(aadhaar|uidai)/i.test(text) || /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(text)) {
    documentType = "Aadhaar";
    const numMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
    if (numMatch) {
      idNumber = numMatch[0].replace(/\s+/g, "");
    }
  } 
  // PAN
  else if (/\b[A-Z]{5}[0-9]{4}[A-Z]\b/i.test(text) || /(income tax department|govt\.? of india)/i.test(text)) {
    const numMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/i);
    if (numMatch) {
      documentType = "PAN";
      idNumber = numMatch[1].toUpperCase();
    }
  } 
  // Passport
  else if (/passport/i.test(text) || /P<[A-Z0-9<]+/.test(text)) {
    documentType = "Passport";
    const numMatch = text.match(/\b([A-PR-WYa-pr-wy][1-9]\d{6})\b/);
    if (numMatch) idNumber = numMatch[1].toUpperCase();
  } 
  // Voter ID (EPIC)
  else if (/(election commission|epic|elector photo)/i.test(text) || /\b[A-Z]{3}[0-9]{7}\b/i.test(text)) {
    documentType = "Voter ID";
    const numMatch = text.match(/\b([A-Z]{3}[0-9]{7})\b/i);
    if (numMatch) idNumber = numMatch[1].toUpperCase();
  }

  // Name extraction (very basic heuristic)
  if (lines.length > 0) {
    const textLines = lines.map((l: any) => (l.text || "").trim()).filter((l: string) => l.length > 0);
    // Find line after "Name" or similar
    const nameLabelIdx = textLines.findIndex((l: string) => /^(name|father's name|father name)/i.test(l));
    if (nameLabelIdx >= 0 && nameLabelIdx + 1 < textLines.length) {
      name = textLines[nameLabelIdx + 1].replace(/^[^:]+:\s*/, "");
    } else {
      // Fallback: longest uppercase sequence (rough heuristic for Indian IDs)
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
    extractedFields: { name, dob, idNumber, expiryDate },
    ocrConfidenceScore,
  };
}
