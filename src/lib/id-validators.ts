export type DocType = "Aadhaar" | "PAN" | "Passport" | "Voter ID" | "Unknown";

export interface ValidationResult {
  valid: boolean | null;
  reason: string;
  algorithm: string;
}

// 1. Verhoeff algorithm matrices for check-digit validation
const VERHOEFF_D: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const VERHOEFF_P: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];



export function validateVerhoeff(numStr: string): boolean {
  const clean = numStr.replace(/\s+/g, "");
  if (!/^\d{12}$/.test(clean)) return false;
  let c = 0;
  const reversed = clean.split("").reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversed[i]]];
  }
  return c === 0;
}

export function validateIdNumber(docType: DocType, idNumber: string): ValidationResult {
  const sanitized = idNumber.trim().replace(/\s+/g, "").toUpperCase();

  switch (docType) {
    case "Aadhaar": {
      if (!/^\d{12}$/.test(sanitized)) {
        return {
          valid: false,
          reason: "Invalid length: Aadhaar must be exactly 12 numeric digits.",
          algorithm: "Verhoeff Base-10 Dihedral Checksum"
        };
      }
      const passesChecksum = validateVerhoeff(sanitized);
      return {
        valid: passesChecksum,
        reason: passesChecksum
          ? "Passed Verhoeff check-digit validation."
          : "Checksum violation: Check-digit mismatch indicates an artificially altered or fabricated sequence.",
        algorithm: "Verhoeff Base-10 Dihedral Checksum"
      };
    }

    case "PAN": {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
      const valid = panRegex.test(sanitized);
      return {
        valid,
        reason: valid
          ? "Syntactically valid PAN format (5 letters, 4 digits, 1 letter)."
          : "Invalid alphanumeric structure for PAN.",
        algorithm: "Income Tax Department Static Regex Check"
      };
    }

    case "Passport": {
      // Standard Indian passport format: 1 uppercase letter followed by 7 numeric digits
      const passRegex = /^[A-PR-WYa-pr-wy][1-9]\d{6}$/;
      const valid = passRegex.test(sanitized);
      return {
        valid,
        reason: valid
          ? "Passport standard series structure verified (Note: MRZ check digit requires OCR line evaluation)."
          : "Invalid passport format: Must adhere to series character + 7 digits.",
        algorithm: "ICAO Doc 9303 Alphanumeric Format Mask"
      };
    }

    case "Voter ID": {
      // Standard Election Commission of India (EPIC) code: 3 alpha prefix followed by 7 digits
      const epicRegex = /^[A-Z]{3}[0-9]{7}$/;
      const valid = epicRegex.test(sanitized);
      return {
        valid,
        reason: valid
          ? "Valid standard 10-character EPIC format."
          : "Invalid EPIC/Voter ID pattern.",
        algorithm: "ECI EPIC Pattern Validation"
      };
    }

    default:
      return {
        valid: null,
        reason: "Document type unrecognized or deterministic algorithm unavailable.",
        algorithm: "None"
      };
  }
}
