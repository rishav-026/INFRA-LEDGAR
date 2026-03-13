/* ─── Routes ─── */

export const ROUTES = {
  HOME: '/',
  PROJECT_DETAIL: '/project/:id',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CREATE_PROJECT: '/projects/new',
  RELEASE_FUNDS: '/projects/:id/funds',
  UPLOAD_PROOF: '/projects/:id/proof',
  ADMIN: '/admin',
} as const;

/* ─── External URLs ─── */

export const POLYGONSCAN_BASE = 'https://amoy.polygonscan.com/tx/';
export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

/* ─── API ─── */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

/* ─── Polling ─── */

export const POLLING_INTERVAL_MS = 30_000; // 30 seconds

/* ─── Pagination ─── */

export const DEFAULT_PAGE_SIZE = 20;

/* ─── Risk Thresholds ─── */

export const RISK_THRESHOLDS = {
  HIGH: 0.6,
  MEDIUM: 0.3,
} as const;

/* ─── Role Labels ─── */

export const ROLE_LABELS: Record<string, string> = {
  government: 'Government',
  contractor: 'Contractor',
  citizen: 'Citizen',
};

/* ─── Status Labels ─── */

export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  flagged: 'Flagged',
  archived: 'Archived',
};

/* ─── File Upload ─── */

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const ALLOWED_FILE_EXTENSIONS = '.jpg,.jpeg,.png,.pdf,.docx';
