export type RiskLevel = "Low" | "Medium" | "High";
export type Severity = "Low" | "Medium" | "High";

export const summaryStats = {
  documentsAnalyzed: 1248,
  suspiciousCases: 23,
  pendingReviews: 47,
  approvedToday: 18,
};

export const recentActivity = [
  { id: 1, time: "09:42", actor: "Officer M. Patel", action: "Approved verification case", ref: "UNV-2041", tone: "success" as const },
  { id: 2, time: "09:18", actor: "System", action: "Flagged tampered idDocumentValue", ref: "DOC-8821", tone: "danger" as const },
  { id: 3, time: "08:55", actor: "forensic analyst K. Singh", action: "Requested additional documents", ref: "UNV-2039", tone: "warning" as const },
  { id: 4, time: "08:31", actor: "Customer A. Sharma", action: "Submitted new application", ref: "UNV-2040", tone: "info" as const },
  { id: 5, time: "08:02", actor: "System", action: "Cross-check completed", ref: "UNV-2038", tone: "success" as const },
];

export interface AlertItem {
  id: string;
  severity: Severity;
  title: string;
  source: string;
  time: string;
  detail?: string;
  reasons?: string[];
  recommendation?: string;
}

export const recentAlerts: AlertItem[] = [
  {
    id: "ALR-3391",
    severity: "High",
    title: "Tampered income document detected",
    source: "DOC-8821",
    time: "12 min ago",
    detail: "Income figures on idDocumentValue do not match KYC Record credits for the same employer.",
    reasons: [
      "Font inconsistency in income field",
      "PDF edited in Adobe Acrobat 6h before upload",
      "Stated income exceeds bank-credited salary by 30%",
    ],
    recommendation: "Hold application UNV-2041 and request re-submission of the original employer idDocumentValue.",
  },
  {
    id: "ALR-3388",
    severity: "Medium",
    title: "Mismatched DOB across records",
    source: "UNV-2039",
    time: "1 h ago",
    detail: "Date of birth on Secondary Document differs from idDocumentValue and bank KYC record.",
    reasons: ["Primary Document (Extracted OCR): 12-04-1989", "Bank KYC: 12-04-1989", "Secondary Document: 21-04-1989"],
    recommendation: "Verify with applicant and update KYC if a typo is confirmed.",
  },
  {
    id: "ALR-3380",
    severity: "Low",
    title: "Unusual login location",
    source: "EMP-114",
    time: "3 h ago",
    detail: "Employee K. Singh authenticated from Singapore at 02:14 local time.",
    reasons: ["New geography", "Outside business hours", "VPN exit node"],
    recommendation: "Confirm session with employee and rotate access token if unrecognized.",
  },
];

export const REAL_WORLD_INCIDENTS = [
  // HIGH-PROFILE CORPORATE & ESTATE FRAUD
  { id: "UNV-9001", applicant: "Naussany Investments", type: "Estate case", risk: "High" as RiskLevel, score: 98, status: "Escalated", flags: ["Forged Notary Signature", "Fabricated collateral deed"] },
  { id: "UNV-9002", applicant: "1inMM Capital", type: "Corporate Credit", risk: "High" as RiskLevel, score: 99, status: "Escalated", flags: ["Spoofed email domains", "Forged licensing agreements"] },
  { id: "UNV-9003", applicant: "The Croft Group", type: "Lease Security", risk: "High" as RiskLevel, score: 95, status: "Pending Review", flags: ["Unregistered $500k Letter of Credit", "Bank metadata mismatch"] },
  // PROPERTY MANIPULATION
  { id: "UNV-8001", applicant: "Kiran Reddy", type: "Mortgage", risk: "High" as RiskLevel, score: 94, status: "Escalated", flags: ["Multiple financing on same Patta", "Sub-division plan manipulated"] },
  { id: "UNV-8002", applicant: "Venkatesh Rao", type: "Home case", risk: "High" as RiskLevel, score: 88, status: "Under Review", flags: ["TS-RERA registration invalid", "Property mortgaged with another NBFC"] },
  { id: "UNV-8003", applicant: "Suresh Babu", type: "Mortgage", risk: "High" as RiskLevel, score: 92, status: "Escalated", flags: ["Fabricated property agreement", "Seller-Borrower collusion detected"] },
  { id: "UNV-8004", applicant: "Priya Sharma", type: "Property case", risk: "Medium" as RiskLevel, score: 65, status: "Pending Review", flags: ["Discrepancy in survey numbers"] },
  { id: "UNV-8005", applicant: "Manoj Desai", type: "Mortgage", risk: "High" as RiskLevel, score: 81, status: "Escalated", flags: ["Fake society NOC document", "Original title deed missing"] },
  { id: "UNV-8006", applicant: "Anita Patel", type: "Home case", risk: "Low" as RiskLevel, score: 12, status: "Approved", flags: [] },
  { id: "UNV-8007", applicant: "Ramesh Iyer", type: "Mortgage", risk: "High" as RiskLevel, score: 97, status: "Escalated", flags: ["Plot number altered digitally", "Duplicate encumbrance certificate"] },
  // FIRST-PARTY FRAUD
  { id: "UNV-7001", applicant: "Rohan Desai", type: "Personal case", risk: "High" as RiskLevel, score: 85, status: "Under Review", flags: ["Stated income differs from bank-credited salary by 40%", "Form-16 altered"] },
  { id: "UNV-7002", applicant: "Anjali Gupta", type: "Auto case", risk: "High" as RiskLevel, score: 82, status: "Escalated", flags: ["KYC Record template sourced from Telegram", "Font inconsistency in transaction logs"] },
  { id: "UNV-7003", applicant: "Vikram Singh", type: "Personal case", risk: "Medium" as RiskLevel, score: 68, status: "Pending Review", flags: ["Inflated cashflow", "Suspicious recurring deposits"] },
  { id: "UNV-7004", applicant: "Neha Verma", type: "Education case", risk: "Low" as RiskLevel, score: 4, status: "Approved", flags: [] },
  { id: "UNV-7005", applicant: "Arjun Nair", type: "Auto case", risk: "High" as RiskLevel, score: 91, status: "Escalated", flags: ["Primary Document (Extracted OCR) net pay does not match gross deductions", "Employer PAN invalid"] },
  { id: "UNV-7006", applicant: "Kavya Menon", type: "Personal case", risk: "High" as RiskLevel, score: 77, status: "Under Review", flags: ["Salary account credited via UPI, not NEFT/RTGS"] },
  { id: "UNV-7007", applicant: "Siddharth Das", type: "Credit Card", risk: "High" as RiskLevel, score: 84, status: "Escalated", flags: ["ITR V acknowledgment number fails checksum"] },
  { id: "UNV-7008", applicant: "Pooja Joshi", type: "Auto case", risk: "Low" as RiskLevel, score: 2, status: "Approved", flags: [] },
  { id: "UNV-7009", applicant: "Tarun Kapoor", type: "Personal case", risk: "High" as RiskLevel, score: 96, status: "Escalated", flags: ["Company HR email bounces", "Fake employment letterhead"] },
  { id: "UNV-7010", applicant: "Divya Agarwal", type: "Credit Card", risk: "Medium" as RiskLevel, score: 55, status: "Pending Review", flags: ["Address proof mismatch with credit bureau"] },
  // SYNTHETIC IDENTITY & KYC FORGERY
  { id: "UNV-6001", applicant: "Unknown (Synthetic ID)", type: "Credit Line", risk: "High" as RiskLevel, score: 99, status: "Escalated", flags: ["CIBIL history initialized 30 days ago", "Morphed PAN card photo"] },
  { id: "UNV-6002", applicant: "John Doe Variant", type: "Auto case", risk: "High" as RiskLevel, score: 95, status: "Escalated", flags: ["Aadhar QR code routes to different demographic data"] },
  { id: "UNV-6003", applicant: "Ravi Teja", type: "Personal case", risk: "High" as RiskLevel, score: 88, status: "Under Review", flags: ["Utility bill barcode manipulated", "Address does not exist"] },
  { id: "UNV-6004", applicant: "Sneha Reddy", type: "Credit Card", risk: "Low" as RiskLevel, score: 8, status: "Approved", flags: [] },
  { id: "UNV-6005", applicant: "Multiple Apps", type: "Microfinance", risk: "High" as RiskLevel, score: 93, status: "Escalated", flags: ["Same device IP used for 14 different identities", "Deepfake video KYC"] },
  { id: "UNV-6006", applicant: "Gaurav Sen", type: "Education case", risk: "High" as RiskLevel, score: 76, status: "Pending Review", flags: ["Passport MRZ code fails validation algorithm"] },
  { id: "UNV-6007", applicant: "Meera Krishnan", type: "Personal case", risk: "Low" as RiskLevel, score: 5, status: "Approved", flags: [] },
  { id: "UNV-6008", applicant: "Imposter ID 404", type: "Credit Card", risk: "High" as RiskLevel, score: 97, status: "Escalated", flags: ["Deceased person PAN utilized"] },
  { id: "UNV-6009", applicant: "Aditya Jain", type: "Auto case", risk: "Medium" as RiskLevel, score: 45, status: "Under Review", flags: ["Voter ID font does not match ECI standards"] },
  { id: "UNV-6010", applicant: "Kunal Bhatia", type: "Personal case", risk: "High" as RiskLevel, score: 82, status: "Escalated", flags: ["Identity theft indicator", "Recent address change across all bureaus"] },
  // BUSINESS & MSME case FRAUD
  { id: "UNV-5001", applicant: "TechNova Solutions", type: "Working Capital", risk: "High" as RiskLevel, score: 94, status: "Escalated", flags: ["Circular trading detected", "B2B invoices to same entity"] },
  { id: "UNV-5002", applicant: "Sri Sai Enterprises", type: "MSME case", risk: "High" as RiskLevel, score: 89, status: "Under Review", flags: ["GST returns do not match bank inward remittances"] },
  { id: "UNV-5003", applicant: "Global Trade Exim", type: "Trade Finance", risk: "High" as RiskLevel, score: 96, status: "Escalated", flags: ["Shell company indicator", "Director linked to 40 struck-off companies"] },
  { id: "UNV-5004", applicant: "Apex Manufacturing", type: "Machinery case", risk: "Low" as RiskLevel, score: 11, status: "Approved", flags: [] },
  { id: "UNV-5005", applicant: "Nexus Logistics", type: "Working Capital", risk: "High" as RiskLevel, score: 85, status: "Pending Review", flags: ["Audited financials lack UDIN", "CA signature forged"] },
  { id: "UNV-5006", applicant: "Vanguard Retail", type: "MSME case", risk: "High" as RiskLevel, score: 92, status: "Escalated", flags: ["Inventory photos are stock images", "Warehouse address is residential"] },
  { id: "UNV-5007", applicant: "Prime Builders", type: "Project Finance", risk: "Medium" as RiskLevel, score: 58, status: "Under Review", flags: ["Over-invoicing of raw materials"] },
  { id: "UNV-5008", applicant: "Sunrise Traders", type: "Working Capital", risk: "Low" as RiskLevel, score: 7, status: "Approved", flags: [] },
  { id: "UNV-5009", applicant: "Zenith Pharma", type: "MSME case", risk: "High" as RiskLevel, score: 79, status: "Pending Review", flags: ["Mismatch in Udyam Registration classification"] },
  { id: "UNV-5010", applicant: "Alpha Core IT", type: "Business case", risk: "High" as RiskLevel, score: 98, status: "Escalated", flags: ["Fake POs from non-existent clients", "KYC Record PDF generated via Foxit"] },
  // DIGITAL TAMPERING & METADATA ANOMALIES
  { id: "UNV-4001", applicant: "Nitin Sharma", type: "Personal case", risk: "High" as RiskLevel, score: 87, status: "Under Review", flags: ["Metadata: Edited in Adobe Photoshop CS6 2 hours ago"] },
  { id: "UNV-4002", applicant: "Priyanka Roy", type: "Home case", risk: "High" as RiskLevel, score: 93, status: "Escalated", flags: ["Hidden text layers detected in PDF", "White text placed over original dates"] },
  { id: "UNV-4003", applicant: "Rishabh Patel", type: "Auto case", risk: "Medium" as RiskLevel, score: 62, status: "Pending Review", flags: ["Image EXIF data shows capture date after document creation date"] },
  { id: "UNV-4004", applicant: "Shruti Hassan", type: "Personal case", risk: "Low" as RiskLevel, score: 3, status: "Approved", flags: [] },
  { id: "UNV-4005", applicant: "Vivek Chawla", type: "Education case", risk: "High" as RiskLevel, score: 81, status: "Escalated", flags: ["Fonts not embedded properly", "System fonts substituted for bank proprietary fonts"] },
  { id: "UNV-4006", applicant: "Swati Mishra", type: "Credit Card", risk: "High" as RiskLevel, score: 90, status: "Under Review", flags: ["PDF Producer: ilovepdf.com", "Document assembly restricted in source"] },
  { id: "UNV-4007", applicant: "Ganesh Kumar", type: "Auto case", risk: "High" as RiskLevel, score: 85, status: "Pending Review", flags: ["Inconsistent compression artifacts around numerical values"] },
  { id: "UNV-4008", applicant: "Karthik Raj", type: "Personal case", risk: "Low" as RiskLevel, score: 6, status: "Approved", flags: [] },
  { id: "UNV-4009", applicant: "Deepak Verma", type: "Business case", risk: "High" as RiskLevel, score: 95, status: "Escalated", flags: ["Multiple invisible digital signatures found", "Document saved 14 times in 5 minutes"] },
  { id: "UNV-4010", applicant: "Ananya Singh", type: "Mortgage", risk: "Medium" as RiskLevel, score: 71, status: "Under Review", flags: ["DPI mismatch between logo header and body text"] },
];

export const analyzedDocuments = REAL_WORLD_INCIDENTS.map((inc) => ({
  id: `DOC-${inc.id.replace("UNV-", "")}`,
  name: `${inc.type} — ${inc.applicant}`,
  type: inc.type,
  applicationId: inc.id,
  uploaded: `2025-05-${String(Math.floor(Math.random() * 20) + 1).padStart(2, "0")}`,
  tamperScore: inc.score,
  risk: inc.risk,
  reasons: inc.flags,
}));

export const sampleCrossCheck = {
  applicationId: "UNV-8021",
  applicant: "Kiran Reddy",
  fields: [
    { field: "ID Number", idDocumentValue: "7823 4519 0021", kycRecordValue: "7823 4519 0024", secondaryDocumentValue: "7823 4519 0024", match: false },
    { field: "Full Name", idDocumentValue: "Kiran Reddy", kycRecordValue: "Kiran Reddy", secondaryDocumentValue: "Kiran Reddy", match: true },
    { field: "Date of Birth", idDocumentValue: "15-08-1992", kycRecordValue: "15-08-1992", secondaryDocumentValue: "15-08-1992", match: true },
  ],
};

export const customerApplication = {
  trackingId: "UNV-2040",
  applicant: "Aanya Sharma",
  product: "Home case",
  submittedOn: "2025-05-10",
  eta: "3 business days remaining",
  currentStage: 2,
  stages: [
    { label: "Submitted", date: "May 10, 09:12", status: "done" as const },
    { label: "Under Review", date: "May 12, 14:30", status: "done" as const },
    { label: "Documents Verified", date: "In progress", status: "current" as const },
    { label: "Approved / Rejected", date: "Expected May 17", status: "pending" as const },
  ],
  notifications: [
    { id: 1, time: "May 12, 14:30", message: "Your application has moved to review stage." },
    { id: 2, time: "May 11, 10:02", message: "Initial documents received and acknowledged." },
    { id: 3, time: "May 10, 09:14", message: "Application UNV-2040 submitted successfully." },
  ],
};

export const employees = [
  { id: "EMP-101", name: "M. Patel", role: "Bank Officer", actionsToday: 42, anomaly: 4 },
  { id: "EMP-114", name: "K. Singh", role: "forensic analyst", actionsToday: 27, anomaly: 76 },
  { id: "EMP-122", name: "S. Verma", role: "Manager", actionsToday: 14, anomaly: 18 },
  { id: "EMP-134", name: "R. Iyer", role: "Security Analyst", actionsToday: 9, anomaly: 8 },
];

export const securityAlerts: (AlertItem & { employee: string; department: string; event: string; anomaly: number })[] = [
  { id: "SEC-9011", time: "2025-05-15 02:14", employee: "EMP-114", department: "forensic analysis", event: "Login from new geography (Singapore)", severity: "High", anomaly: 91, source: "EMP-114", title: "Login from new geography", detail: "Authentication from Singapore at 02:14 local time using a new device fingerprint.", reasons: ["New country", "New device", "Outside business hours"], recommendation: "Force MFA re-challenge and notify security lead." },
  { id: "SEC-9008", time: "2025-05-14 22:08", employee: "EMP-101", department: "Operations", event: "After-hours bulk document access", severity: "Medium", anomaly: 64, source: "EMP-101", title: "Bulk document access", detail: "Officer downloaded 132 documents in 4 minutes after 22:00 IST.", reasons: ["Volume spike", "After hours", "Multiple applications touched"], recommendation: "Review download log and confirm operational need." },
  { id: "SEC-9002", time: "2025-05-14 18:42", employee: "EMP-122", department: "Management", event: "Privilege escalation attempt", severity: "Medium", anomaly: 58, source: "EMP-122", title: "Privilege escalation attempt", detail: "Manager S. Verma attempted to access an admin-only audit endpoint.", reasons: ["Forbidden endpoint", "Repeated attempts"], recommendation: "Confirm intent with manager and review role mapping." },
  { id: "SEC-8997", time: "2025-05-14 11:20", employee: "EMP-134", department: "Security", event: "Multiple failed MFA attempts", severity: "Low", anomaly: 22, source: "EMP-134", title: "Failed MFA attempts", detail: "3 failed MFA attempts within 5 minutes from registered device.", reasons: ["3 failures", "Same IP"], recommendation: "No action required; monitor." },
];

export const alertsByDay = [
  { day: "Mon", low: 4, medium: 2, high: 1 },
  { day: "Tue", low: 3, medium: 3, high: 0 },
  { day: "Wed", low: 6, medium: 4, high: 2 },
  { day: "Thu", low: 5, medium: 2, high: 1 },
  { day: "Fri", low: 7, medium: 5, high: 3 },
  { day: "Sat", low: 2, medium: 1, high: 0 },
  { day: "Sun", low: 1, medium: 1, high: 1 },
];

export const tamperReasons = [
  "Font inconsistency detected in income field",
  "Metadata indicates editing in Adobe Acrobat 6h before upload",
  "Stated income differs from bank-credited salary by 30%",
  "Employer name does not match tax filing on record",
];

export interface Application {
  id: string;
  customer: string;
  product: string;
  amount: string;
  submitted: string;
  stage: "Submitted" | "Under Review" | "Verified" | "Approved" | "Rejected";
  risk: RiskLevel;
  officer: string;
}

export const applications: Application[] = [
  { id: "UNV-2041", customer: "M. Iyer", product: "Personal case", amount: "₹8,00,000", submitted: "2025-05-15", stage: "Approved", risk: "Low", officer: "M. Patel" },
  { id: "UNV-2040", customer: "A. Sharma", product: "Home case", amount: "₹62,00,000", submitted: "2025-05-14", stage: "Under Review", risk: "Medium", officer: "K. Singh" },
  { id: "UNV-2039", customer: "R. Sharma", product: "Home case", amount: "₹62,00,000", submitted: "2025-05-13", stage: "Under Review", risk: "High", officer: "K. Singh" },
  { id: "UNV-2038", customer: "P. Joshi", product: "Auto case", amount: "₹14,50,000", submitted: "2025-05-12", stage: "Verified", risk: "Low", officer: "M. Patel" },
  { id: "UNV-2037", customer: "N. Rao", product: "Business case", amount: "₹40,00,000", submitted: "2025-05-11", stage: "Rejected", risk: "High", officer: "S. Verma" },
  { id: "UNV-2036", customer: "V. Kapoor", product: "Home case", amount: "₹72,00,000", submitted: "2025-05-10", stage: "Approved", risk: "Low", officer: "M. Patel" },
];

export interface ReportItem {
  id: string;
  title: string;
  application: string;
  generated: string;
  status: "Ready" | "Generating" | "Failed";
  hash: string;
  type: "Audit" | "Cross-Check" | "Document Review" | "Security";
}

export const reports: ReportItem[] = [
  { id: "RPT-7702", title: "Audit summary — UNV-2041", application: "UNV-2041", generated: "2025-05-15 10:02", status: "Ready", hash: "a91c…f4d2", type: "Audit" },
  { id: "RPT-7701", title: "Cross-check report — UNV-2039", application: "UNV-2039", generated: "2025-05-14 18:11", status: "Ready", hash: "7b22…91ab", type: "Cross-Check" },
  { id: "RPT-7700", title: "Document integrity — DOC-8821", application: "UNV-2041", generated: "2025-05-14 09:31", status: "Ready", hash: "ce10…ab44", type: "Document Review" },
  { id: "RPT-7699", title: "Security incident — EMP-114", application: "—", generated: "2025-05-15 02:30", status: "Ready", hash: "32fa…77cc", type: "Security" },
  { id: "RPT-7698", title: "Monthly compliance digest", application: "—", generated: "2025-05-13 23:00", status: "Generating", hash: "—", type: "Audit" },
];

