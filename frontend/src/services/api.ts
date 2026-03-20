import { apiClient, setGlobalAuthToken } from './apiClient';
import axios from 'axios';
import type { 
  Project, User, Transaction, Proof, DashboardAnalytics, ActivityItem,
  FundReleaseRequest, Milestone, AuditLog,
  ApiResponse, CreateProjectInput, ReleaseFundInput, CompletionUpdateInput, CreateMilestoneInput, Analysis
} from '../types';

export class ApiError extends Error {
  code?: string;
  status?: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, options?: { code?: string; status?: number; fieldErrors?: Record<string, string> }) {
    super(message);
    this.name = 'ApiError';
    this.code = options?.code;
    this.status = options?.status;
    this.fieldErrors = options?.fieldErrors;
  }
}

type ErrorEnvelope = {
  success?: boolean;
  error?: {
    message?: string;
    code?: string;
    details?: {
      fieldErrors?: Record<string, string>;
    };
  };
};

const toApiError = (error: unknown): ApiError => {
  if (!axios.isAxiosError(error)) {
    return new ApiError('Unexpected error occurred');
  }

  const status = error.response?.status;
  const payload = error.response?.data as ErrorEnvelope | undefined;
  const message = payload?.error?.message || error.message || 'Request failed';
  const code = payload?.error?.code;
  const fieldErrors = payload?.error?.details?.fieldErrors;

  return new ApiError(message, { status, code, fieldErrors });
};

type BackendPaginatedProjects = {
  items: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type BackendProject = Partial<Project> & {
  _count?: { proofs?: number };
  proofs?: Partial<Proof>[];
  transactions?: Partial<Transaction>[];
};

type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: User['role'];
    organization: string | null;
  };
};

const toUser = (input: LoginResponse['user']): User => ({
  id: input.id,
  firebaseUid: input.id,
  email: input.email,
  role: input.role,
  displayName: input.displayName,
  organization: input.organization,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const toTransaction = (tx: Partial<Transaction>): Transaction => ({
  id: tx.id || '',
  projectId: tx.projectId || '',
  amount: tx.amount || 0,
  purpose: tx.purpose || '',
  releasedBy: tx.releasedBy || '',
  releaseDate: tx.releaseDate || new Date().toISOString(),
  blockchainTxHash: tx.blockchainTxHash || '',
  blockNumber: tx.blockNumber ?? null,
  status: tx.status || 'pending',
  createdAt: tx.createdAt || new Date().toISOString(),
});

const toProof = (proof: Partial<Proof>): Proof => ({
  id: proof.id || '',
  projectId: proof.projectId || '',
  ipfsHash: proof.ipfsHash || '',
  ipfsUrl: proof.ipfsUrl || '',
  fileName: proof.fileName || '',
  fileSize: proof.fileSize || 0,
  fileType: proof.fileType || '',
  description: proof.description || '',
  uploaderId: proof.uploaderId || '',
  blockchainTxHash: proof.blockchainTxHash || '',
  createdAt: proof.createdAt || new Date().toISOString(),
});

const toMilestone = (milestone: Partial<Milestone>): Milestone => ({
  id: milestone.id || '',
  projectId: milestone.projectId || '',
  name: milestone.name || '',
  escrowAmount: milestone.escrowAmount || 0,
  requiredProofCount: milestone.requiredProofCount || 0,
  requiredCompletionPercentage: milestone.requiredCompletionPercentage || 0,
  status: (milestone.status as Milestone['status']) || 'pending',
  createdAt: milestone.createdAt || new Date().toISOString(),
  updatedAt: milestone.updatedAt || new Date().toISOString(),
});

const toReleaseRequest = (request: Partial<FundReleaseRequest>): FundReleaseRequest => ({
  id: request.id || '',
  projectId: request.projectId || '',
  milestoneId: request.milestoneId ?? null,
  amount: request.amount || 0,
  purpose: request.purpose || '',
  status: (request.status as FundReleaseRequest['status']) || 'pending_checker',
  makerId: request.makerId || '',
  checkerId: request.checkerId ?? null,
  approverId: request.approverId ?? null,
  rejectionReason: request.rejectionReason ?? null,
  blockchainTxHash: request.blockchainTxHash ?? null,
  createdAt: request.createdAt || new Date().toISOString(),
  updatedAt: request.updatedAt || new Date().toISOString(),
  maker: request.maker,
  checker: request.checker,
  approver: request.approver,
  milestone: request.milestone,
});

const toAuditLog = (log: Partial<AuditLog>): AuditLog => ({
  id: log.id || '',
  actorId: log.actorId ?? null,
  projectId: log.projectId ?? null,
  action: log.action || '',
  entityType: log.entityType || '',
  entityId: log.entityId || '',
  metadata: log.metadata ?? null,
  createdAt: log.createdAt || new Date().toISOString(),
  actor: log.actor ?? null,
});

const toProject = (project: BackendProject): Project => ({
  id: project.id || '',
  projectId: project.projectId || '',
  name: project.name || '',
  description: project.description ?? null,
  location: project.location || '',
  totalBudget: project.totalBudget || 0,
  fundsReleased: project.fundsReleased || 0,
  completionPercentage: project.completionPercentage || 0,
  status: project.status || 'active',
  contractorId: project.contractorId || '',
  governmentId: project.governmentId || '',
  startDate: project.startDate || new Date().toISOString(),
  endDate: project.endDate || new Date().toISOString(),
  blockchainTxHash: project.blockchainTxHash || '',
  blockchainProjectId: project.blockchainProjectId || 0,
  proofCount: project.proofCount ?? project._count?.proofs ?? project.proofs?.length ?? 0,
  riskScore: project.riskScore ?? null,
  riskLevel: project.riskLevel ?? null,
  createdAt: project.createdAt || new Date().toISOString(),
  updatedAt: project.updatedAt || new Date().toISOString(),
  contractor: project.contractor,
  transactions: (project.transactions || []).map(toTransaction),
  proofs: (project.proofs || []).map(toProof),
  _count: { proofs: project._count?.proofs ?? project.proofCount ?? 0 },
});

export const setAuthToken = (token: string | null) => {
  setGlobalAuthToken(token);
};

export const login = async (email: string, password: string) => {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
  const payload = res.data.data;
  return {
    token: payload.token,
    user: toUser(payload.user),
  };
};

export const getMe = async () => {
  const res = await apiClient.get<ApiResponse<LoginResponse['user']>>('/auth/me');
  return toUser(res.data.data);
};

export const getProjects = async (page = 1, limit = 10) => {
  const res = await apiClient.get<ApiResponse<BackendPaginatedProjects>>('/projects', { params: { page, limit } });
  return {
    ...res.data.data,
    items: res.data.data.items.map((project) => toProject(project as BackendProject)),
  };
};

export const getProject = async (id: string) => {
  const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
  return toProject(res.data.data as BackendProject);
};

export const createProject = async (data: CreateProjectInput) => {
  try {
    const res = await apiClient.post<ApiResponse<Project>>('/projects', data);
    return res.data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

// The backend route returns the project details populated with transactions, so we don't strictly need a separate endpoint for V1 unless doing specific pagination.
// For compatibility with frontend components, we will extract them from the main project fetch, or proxy to backend if we implement dedicated routes.
// In our current backend, /projects/:id returns full relation data.
export const getTransactions = async (projectId: string) => {
  const res = await getProject(projectId);
  return res.transactions || [];
};

export const getProofs = async (projectId: string) => {
  const res = await getProject(projectId);
  return res.proofs || [];
};

export const uploadProof = async (projectId: string, files: File[], description: string) => {
  const uploaded: Proof[] = [];
  let firstBlockchainTxHash = '';

  // Backend currently accepts one file per request; upload sequentially for V1.
  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append('proofs', file);
      formData.append('description', description);

      const res = await apiClient.post<ApiResponse<Proof>>(`/projects/${projectId}/proofs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      if (!firstBlockchainTxHash) {
        firstBlockchainTxHash = (res.data.data as Partial<Proof>).blockchainTxHash || '';
      }
      uploaded.push(toProof(res.data.data));
    }
  } catch (error) {
    throw toApiError(error);
  }

  return {
    proofs: uploaded,
    ipfsHash: uploaded[0]?.ipfsHash || '',
    blockchainTxHash: firstBlockchainTxHash,
  };
};

export const releaseFunds = async (projectId: string, data: ReleaseFundInput) => {
  try {
    const res = await apiClient.post<ApiResponse<{ request: FundReleaseRequest; project: Project }>>(
      `/projects/${projectId}/release-funds`,
      data
    );
    return {
      request: toReleaseRequest(res.data.data.request),
      project: toProject(res.data.data.project as BackendProject),
    };
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMilestones = async (projectId: string) => {
  const res = await apiClient.get<ApiResponse<Milestone[]>>(`/projects/${projectId}/milestones`);
  return res.data.data.map((m) => toMilestone(m));
};

export const createMilestone = async (projectId: string, data: CreateMilestoneInput) => {
  try {
    const res = await apiClient.post<ApiResponse<Milestone>>(`/projects/${projectId}/milestones`, data);
    return toMilestone(res.data.data);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getReleaseRequests = async (projectId: string) => {
  const res = await apiClient.get<ApiResponse<FundReleaseRequest[]>>(`/projects/${projectId}/release-requests`);
  return res.data.data.map((r) => toReleaseRequest(r));
};

export const reviewReleaseRequest = async (
  projectId: string,
  requestId: string,
  action: 'approve' | 'reject',
  reason?: string
) => {
  try {
    const res = await apiClient.patch<ApiResponse<FundReleaseRequest | { request: FundReleaseRequest; transaction: Transaction; project: Project }>>(
      `/projects/${projectId}/release-requests/${requestId}/review`,
      { action, reason }
    );

    const payload = res.data.data;
    if ('request' in (payload as Record<string, unknown>)) {
      const rich = payload as { request: FundReleaseRequest; transaction: Transaction; project: Project };
      return {
        request: toReleaseRequest(rich.request),
        transaction: toTransaction(rich.transaction),
        project: toProject(rich.project as BackendProject),
      };
    }

    return { request: toReleaseRequest(payload as FundReleaseRequest) };
  } catch (error) {
    throw toApiError(error);
  }
};

export const getProjectAuditLogs = async (projectId: string) => {
  const res = await apiClient.get<ApiResponse<AuditLog[]>>(`/projects/${projectId}/audit-logs`);
  return res.data.data.map((log) => toAuditLog(log));
};

export const updateProjectCompletion = async (projectId: string, data: CompletionUpdateInput) => {
  try {
    const res = await apiClient.patch<ApiResponse<Project>>(`/projects/${projectId}/completion`, data);
    return toProject(res.data.data as BackendProject);
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    const res = await apiClient.delete<ApiResponse<{ id: string; projectId: string; name: string; deleted: boolean }>>(
      `/projects/${projectId}`
    );
    return res.data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getDashboardAnalytics = async () => {
  const res = await apiClient.get<ApiResponse<DashboardAnalytics>>('/analytics');
  return res.data.data;
};

export const analyzeProject = async (projectId: string) => {
  try {
    const res = await apiClient.post<ApiResponse<{ project: Project; analysis: Analysis }>>(`/projects/${projectId}/analyze`);
    return res.data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getProjectRisk = async (projectId: string) => {
  try {
    const res = await apiClient.get<ApiResponse<{ project: Project; analysis: Analysis }>>(`/projects/${projectId}/risk`);
    return res.data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

// Mock recent activity for MVP as requested in TRD
export const getRecentActivity = async () => {
  const projects = await getProjects(1, 5);
  const now = Date.now();
  return projects.items.slice(0, 5).map((project, index) => ({
    id: `act-${project.id}-${index}`,
    projectId: project.id,
    projectName: project.name,
    action: index % 2 === 0 ? 'Fund Released' : 'Proof Uploaded',
    details: index % 2 === 0 ? 'Latest fund release recorded' : 'New work proof submitted',
    date: new Date(now - index * 3600000).toISOString(),
  })) as ActivityItem[];
};

// Users & Admin
export const getUsers = async () => {
  const res = await apiClient.get<ApiResponse<User[]>>('/users');
  return res.data.data.map((user) => ({
    ...user,
    firebaseUid: user.firebaseUid || user.id,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString(),
  }));
};

export const getContractors = async () => {
  const users = await getUsers();
  return users.filter((user) => user.role === 'contractor');
};

export const updateUserRole = async (id: string, role: string) => {
  const res = await apiClient.put<ApiResponse<User>>(`/users/${id}/role`, { role });
  return res.data.data;
};
