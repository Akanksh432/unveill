import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadFile(filename: string, content: string | Blob, mime = "text/plain") {
  if (typeof window === "undefined") return;
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function generateForensicReport(opts: {
  caseId: string;
  timestamp: string;
  operator: string;
  images: { original: string; heatmap: string | null };
  classification: string;
  extracted: { name: string | null; dob: string | null; idNumber: string | null; expiryDate: string | null };
  checksumResult: { valid: boolean | null; reason: string | null };
  scores: { riskScore: number; elaVariance: number | null; ocrConfidence: number; alignmentScore: number };
  flags: string[];
  boxes: { x: number; y: number; width: number; height: number }[];
}) {
  const doc = new jsPDF();
  let currentY = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 112, 243); // Primary color
  doc.text("UNVEIL Forensic Verification Audit", 14, currentY);
  
  currentY += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text("Every anomaly leaves a signal.", 14, currentY);

  currentY += 12;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Case Reference ID: ${opts.caseId}`, 14, currentY);
  currentY += 7;
  doc.text(`Timestamp: ${opts.timestamp}`, 14, currentY);
  currentY += 7;
  doc.text(`Operator: ${opts.operator}`, 14, currentY);

  currentY += 15;

  // Forensic Imaging
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 112, 243);
  doc.text("Forensic Imaging", 14, currentY);
  
  currentY += 10;
  
  const imgWidth = 80;
  const imgHeight = 60;
  
  // Need to ensure images are valid before adding, simplified here 
  // by assuming they are Data URLs.
  if (opts.images.original.startsWith("data:")) {
    doc.addImage(opts.images.original, "JPEG", 14, currentY, imgWidth, imgHeight);
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("[Original Image Missing/Invalid Format]", 14, currentY + 30);
  }

  if (opts.images.heatmap && opts.images.heatmap.startsWith("data:")) {
    doc.addImage(opts.images.heatmap, "JPEG", 104, currentY, imgWidth, imgHeight);
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("N/A — Not a JPEG (ELA requires compression artifacts)", 104, currentY + 30);
  }

  currentY += imgHeight + 10;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Note: Color intensity in ELA heatmaps shows compression differences indicating edited or re-compressed regions.", 14, currentY);

  currentY += 15;

  // Extracted Telemetry Table
  autoTable(doc, {
    startY: currentY,
    head: [["Extracted Telemetry", "Value"]],
    body: [
      ["Document Classification", opts.classification],
      ["ID Number", opts.extracted.idNumber || "N/A"],
      ["Name", opts.extracted.name || "N/A"],
      ["DOB", opts.extracted.dob || "N/A"],
      ["Expiry Date", opts.extracted.expiryDate || "N/A"],
      ["Algorithm Check", opts.checksumResult.reason || "N/A"],
    ],
    theme: "striped",
    headStyles: { fillColor: [0, 112, 243], textColor: 255 },
    columnStyles: { 0: { cellWidth: 70, fontStyle: "bold" } },
    margin: { left: 14 },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Composite Risk Score Breakdown
  autoTable(doc, {
    startY: currentY,
    head: [["Risk Analysis & Sub-Scores", "Value"]],
    body: [
      ["Final Composite Risk Score", `${opts.scores.riskScore}/100 (30% ELA, 25% OCR, 25% Checksum, 20% Layout)`],
      ["ELA Variance (V_ELA)", opts.scores.elaVariance === null ? "N/A — not a JPEG" : opts.scores.elaVariance.toFixed(1)],
      ["OCR Confidence (C_OCR)", Math.round(opts.scores.ocrConfidence).toString()],
      ["Checksum / Format Result", opts.checksumResult.valid === true ? "Valid" : opts.checksumResult.valid === false ? "Invalid" : "Not applicable"],
      ["Checksum / Format Reason", opts.checksumResult.reason || "N/A"],
      ["Layout Consistency Score", opts.scores.alignmentScore.toString()],
      ["Suspicious Regions (Boxes)", opts.boxes.length > 0 ? opts.boxes.map(b => `[X:${b.x}, Y:${b.y}, W:${b.width}, H:${b.height}]`).join(", ") : "None"],
      ...opts.flags.map((f, i) => [`Flag ${i + 1}`, f])
    ],
    theme: "striped",
    headStyles: { fillColor: [0, 112, 243], textColor: 255 },
    columnStyles: { 0: { cellWidth: 70, fontStyle: "bold" } },
    margin: { left: 14 },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Disclaimer
  const pageHeight = doc.internal.pageSize.height;
  if (currentY + 20 > pageHeight) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  const disclaimer = doc.splitTextToSize("Disclaimer: This report is generated as an explainable forensic aid for human auditors and should not be used as an autonomous, sole-factor legal rejection.", 180);
  doc.text(disclaimer, 14, currentY);

  return doc.output("blob");
}

export async function generateAuditReport(opts: {
  title: string;
  subject?: string;
  sections: { heading: string; rows: [string, string][] }[];
}) {
  const ts = new Date().toISOString();
  const body = `${opts.title}|${ts}|${JSON.stringify(opts.sections)}`;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("").slice(0, 32);

  const doc = new jsPDF();
  let currentY = 20;

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 112, 243);
  doc.text("UNVEIL", 14, currentY);
  
  currentY += 10;
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text(opts.title, 14, currentY);

  if (opts.subject) {
    currentY += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Subject: ${opts.subject}`, 14, currentY);
  }

  currentY += 8;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${ts}`, 14, currentY);
  currentY += 15;

  opts.sections.forEach((section) => {
    autoTable(doc, {
      startY: currentY,
      head: [[section.heading, ""]],
      body: section.rows,
      theme: "striped",
      headStyles: { fillColor: [0, 112, 243], textColor: 255 },
      columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" } },
      margin: { left: 14 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  });

  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Every anomaly leaves a signal. | SHA-256 Hash: ${hashHex}`, 14, pageHeight - 10);
  return doc.output("blob");
}

export interface DocumentLike {
  id: string;
  name: string;
  type: string;
  uploaded: string;
  risk: string;
  tamperScore: number;
  applicationId: string;
}

export async function generateDocumentReport(
  doc: DocumentLike,
  flags: string[],
) {
  return generateAuditReport({
    title: `Document review — ${doc.id}`,
    subject: doc.name,
    sections: [
      {
        heading: "Summary",
        rows: [
          ["Document ID", doc.id],
          ["Application", doc.applicationId],
          ["Type", doc.type],
          ["Uploaded", doc.uploaded],
          ["Risk", doc.risk],
          ["Tamper score", `${doc.tamperScore}/100`],
        ],
      },
      {
        heading: "Flags",
        rows: flags.map((r, i) => [`Flag ${i + 1}`, r]),
      },
    ],
  });
}
