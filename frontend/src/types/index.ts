/* ─── Enums ─── */

export type UserRole = 'government' | 'contractor' | 'citizen';
export type ProjectStatus = 'active' | 'completed' | 'flagged' | 'archived';
export type RiskLevel = 'normal' | 'medium' | 'high';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

/* ─── User ─── */

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  role: UserRole;
  displayName: string;
  organization: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ─── Project ─── */

export interface Project {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  location: string;
  totalBudget: number;       // paise
  fundsReleased: number;     // paise
  completionPercentage: number;
  status: ProjectStatus;
  contractorId: string;
  contractorName?: string;
  governmentId: string;
  startDate: string;
  endDate: string;
  blockchainTxHash: string;
  blockchainProjectId: number;
  proofCount: number;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  createdAt: string;
  updatedAt: string;
  contractor?: {
    id: string;
    displayName: string;
    organization: string | null;
  };
  transactions?: Transaction[];
  proofs?: Proof[];
  _count?: {
    proofs: number;
  };
}

/* ─── Transaction (fund release) ─── */

export interface Transaction {
  id: string;
  projectId: string;
  amount: number;            // paise
  purpose: string;
  releasedBy: string;
  releaseDate: string;
  blockchainTxHash: string;
  blockNumber: number | null;
  status: TransactionStatus;
  createdAt: string;
}

/* ─── Proof ─── */

export interface Proof {
  id: string;
  projectId: string;
  ipfsHash: string;
  ipfsUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  description: string;
  uploaderId: string;
  blockchainTxHash: string;
  createdAt: string;
}

/* ─── AI Analysis ─── */

export interface AnalysisFeatures {
  fundsReleasedPct: number;
  completionPct: number;
  budgetProgressGapPct?: number;
  proofCount: number;
  daysElapsed: number;
  transactionCount?: number;
  releaseFrequency: number;
  meanReleaseSizePct?: number;
}

export interface WeightedFeatureContribution {
  key: string;
  label: string;
  weight: number;
  normalized: number;
  contribution: number;
}

export interface Analysis {
  provider: string;
  modelVersion?: string;
  confidence?: number;
  dataQuality?: 'insufficient' | 'sufficient';
  riskScore: number;
  riskLevel: RiskLevel;
  features: AnalysisFeatures;
  flaggedAnomalies?: string[];
  reasoning?: string;
  weightedFeatures?: WeightedFeatureContribution[];
}

/* ─── Dashboard Analytics ─── */

export interface DashboardAnalytics {
  totalProjects: number;
  totalBudget: number;
  totalFundsReleased: number;
  totalProofsUploaded: number;
  activeProjects: number;
  flaggedProjects: number;
}

/* ─── Activity ─── */

export interface ActivityItem {
  id: string;
  date: string;
  action: string;
  projectId: string;
  projectName: string;
  details: string;
}

/* ─── API Response ─── */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

/* ─── Form Inputs ─── */

export interface CreateProjectInput {
  name: string;
  description?: string;
  totalBudget: number;
  location: string;
  contractorId: string;
  startDate: string;
  endDate: string;
}

export interface ReleaseFundInput {
  amount: number;
  purpose: string;
  releaseDate: string;
}

export interface UploadProofInput {
  files: File[];
  description: string;
}
