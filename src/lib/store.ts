import { create } from "zustand";
import type { RiskLevel, AlertItem } from "./sample-data";
import { recentAlerts } from "./sample-data";

export interface ForensicVerificationCase {
  trackingId: string;
  applicant: string;
  product: string;
  amount: string;
  submittedOn: string;
  eta: string;
  currentStage: number;
  stages: { label: string; date: string; status: "done" | "current" | "pending" }[];
  notifications: { id: number; time: string; message: string }[];
  crossCheck: {
    fields: { field: string; idDocumentValue: string; kycRecordValue: string; secondaryDocumentValue: string; match: boolean }[];
  };
  stage: "Submitted" | "Under Review" | "Verified" | "Approved" | "Rejected";
  risk: RiskLevel;
  officer: string;
}

export type StoreAlert = AlertItem & { read: boolean };

interface AppStore {
  applications: Record<string, ForensicVerificationCase>;
  alerts: Record<string, StoreAlert>;

  // Actions
  acknowledgeAlert: (id: string) => void;
  escalateApplication: (id: string) => void;
  rerunCrossCheck: (id: string) => void;
}

const seedApplications: Record<string, ForensicVerificationCase> = {
  "UNV-8021": {
    trackingId: "UNV-8021",
    applicant: "Kiran Reddy",
    product: "Identity Verification",
    amount: "Aadhaar",
    submittedOn: "2026-09-26",
    eta: "Review paused",
    currentStage: 1,
    stages: [
      { label: "Submitted", date: "Sep 26, 09:12", status: "done" },
      { label: "Under Review", date: "Paused", status: "current" },
      { label: "Documents Verified", date: "Pending", status: "pending" },
      { label: "Approved / Rejected", date: "Pending", status: "pending" },
    ],
    notifications: [
      { id: 1, time: "Sep 26, 10:00", message: "Anomalies detected: Verhoeff failure, ELA localized tampering spike." },
    ],
    crossCheck: {
      fields: [
        { field: "ID Number", idDocumentValue: "7823 4519 0021", kycRecordValue: "7823 4519 0024", secondaryDocumentValue: "7823 4519 0024", match: false },
        { field: "Full Name", idDocumentValue: "Kiran Reddy", kycRecordValue: "Kiran Reddy", secondaryDocumentValue: "Kiran Reddy", match: true },
        { field: "Date of Birth", idDocumentValue: "15-08-1992", kycRecordValue: "15-08-1992", secondaryDocumentValue: "15-08-1992", match: true },
      ],
    },
    stage: "Under Review",
    risk: "High",
    officer: "K. Singh",
  },
  "UNV-8022": {
    trackingId: "UNV-8022",
    applicant: "Aanya Sharma",
    product: "Identity Verification",
    amount: "PAN",
    submittedOn: "2026-09-25",
    eta: "Approved",
    currentStage: 4,
    stages: [
      { label: "Submitted", date: "Sep 25, 09:12", status: "done" },
      { label: "Under Review", date: "Sep 25, 14:30", status: "done" },
      { label: "Documents Verified", date: "Sep 25, 16:00", status: "done" },
      { label: "Approved / Rejected", date: "Sep 25, 17:00", status: "done" },
    ],
    notifications: [{ id: 1, time: "Sep 25, 17:00", message: "Verification approved: Valid alphanumeric syntax, smooth ELA response." }],
    crossCheck: {
      fields: [
        { field: "ID Number", idDocumentValue: "ABCDE1234F", kycRecordValue: "ABCDE1234F", secondaryDocumentValue: "ABCDE1234F", match: true },
        { field: "Full Name", idDocumentValue: "Aanya Sharma", kycRecordValue: "Aanya Sharma", secondaryDocumentValue: "Aanya Sharma", match: true },
      ],
    },
    stage: "Approved",
    risk: "Low",
    officer: "M. Patel",
  },
  "UNV-8023": {
    trackingId: "UNV-8023",
    applicant: "Rohan Sharma",
    product: "Identity Verification",
    amount: "Passport",
    submittedOn: "2026-09-24",
    eta: "Rejected",
    currentStage: 4,
    stages: [
      { label: "Submitted", date: "Sep 24, 09:12", status: "done" },
      { label: "Under Review", date: "Sep 24, 14:30", status: "done" },
      { label: "Documents Verified", date: "Failed", status: "done" },
      { label: "Approved / Rejected", date: "Rejected", status: "done" },
    ],
    notifications: [
      { id: 1, time: "Sep 24, 15:00", message: "Verification failed: High local pixel delta, baseline misalignment on Name field." },
    ],
    crossCheck: {
      fields: [
        { field: "Full Name", idDocumentValue: "Rohan Kumar Sharma", kycRecordValue: "Rohan Sharma", secondaryDocumentValue: "Rohan Sharma", match: false },
        { field: "ID Number", idDocumentValue: "P1234567", kycRecordValue: "P1234567", secondaryDocumentValue: "P1234567", match: true },
      ],
    },
    stage: "Rejected",
    risk: "High",
    officer: "S. Verma",
  },
};

const seedAlerts: Record<string, StoreAlert> = recentAlerts.reduce((acc, alert) => {
  acc[alert.id] = { ...alert, read: false };
  return acc;
}, {} as Record<string, StoreAlert>);

export const useStore = create<AppStore>((set) => ({
  applications: seedApplications,
  alerts: seedAlerts,

  acknowledgeAlert: (id) => set((state) => ({
    alerts: {
      ...state.alerts,
      [id]: { ...state.alerts[id], read: true }
    }
  })),

  escalateApplication: (id) => set((state) => {
    const app = state.applications[id];
    if (!app) return state;

    return {
      applications: {
        ...state.applications,
        [id]: {
          ...app,
          risk: "High",
          stage: "Under Review",
          eta: "Escalated for Manual Review",
          notifications: [
            { id: Date.now(), time: new Date().toLocaleTimeString(), message: "Application escalated to senior team." },
            ...app.notifications,
          ]
        }
      }
    };
  }),

  rerunCrossCheck: (id) => set((state) => {
    const app = state.applications[id];
    if (!app) return state;

    // Simulate fixing minor mismatches or updating timestamp
    const updatedFields = app.crossCheck.fields.map(f => ({
      ...f,
      // If it was mismatched, maybe simulate it being fixed
      match: true,
      kycRecordValue: f.idDocumentValue,
      secondaryDocumentValue: f.idDocumentValue,
    }));

    return {
      applications: {
        ...state.applications,
        [id]: {
          ...app,
          crossCheck: {
            fields: updatedFields
          },
          notifications: [
            { id: Date.now(), time: new Date().toLocaleTimeString(), message: "Cross-check re-run completed." },
            ...app.notifications,
          ]
        }
      }
    };
  }),
}));
