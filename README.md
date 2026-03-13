# InfraLedger

InfraLedger is a full-stack infrastructure monitoring platform for transparent public project tracking.

It combines:
- role-based operations (government and contractor)
- public-facing project visibility
- blockchain-backed fund/proof records
- IPFS evidence storage
- local explainable ML risk assessment

This repository is a monorepo with separate backend and frontend applications.

## 1. Current Status

Implemented and working:
- backend REST APIs for auth, users, projects, analytics
- fund release and proof recording with blockchain tx hashes
- proof uploads to IPFS with integrity validation
- explainable local ML risk scoring (`local-ml-risk-v2`)
- redesigned frontend dashboard UI/UX (cards, gradients, sorting/search, better loading/error states)

Important:
- backend can run with real integrations (Pinata + Amoy) or fallback mock mode when keys are missing

## 2. Tech Stack

Backend:
- Node.js + Express + TypeScript
- Prisma ORM + SQLite (local dev)
- Ethers.js + Hardhat (Polygon Amoy)
- Multer for file intake

Frontend:
- React + TypeScript + Vite
- Tailwind CSS (v4)
- Recharts
- Lucide icons

## 3. Monorepo Structure

```text
Infra-Ledger/
├── backend/
│   ├── contracts/              # Solidity contracts
│   ├── scripts/                # Hardhat deploy scripts
│   ├── prisma/                 # Prisma schema + local DB
│   └── src/
│       ├── routes/             # API routes
│       ├── services/           # Auth, IPFS, blockchain, risk engine
│       └── server.ts
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── services/
│       ├── context/
│       └── types/
├── architecture_roadmap.md
├── ux_screen_breakdown.md
└── SETUP_FREE_TIER.md
```

## 4. Architecture (Current)



## 5. Explainable Risk Engine

Model provider:
- `provider: local-ml`
- `modelVersion: local-ml-risk-v2`

Main feature set:
- funds released percentage
- completion percentage
- budget-progress gap
- proof count
- days elapsed
- transaction count
- release frequency
- mean release size percentage

Output fields:
- `riskScore` (0-1)
- `riskLevel` (`normal`, `medium`, `high`)
- `confidence`
- `reasoning`
- `flaggedAnomalies`
- `weightedFeatures` (per-factor contribution)
- `dataQuality` (`sufficient` or `insufficient`)

Special handling:
- if there is no transactional/proof activity, model returns insufficient-data mode instead of a misleading score

## 6. API Overview

Auth:
- `POST /api/auth/login`
- `GET /api/auth/me`

Projects:
- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/projects/:id/risk` (public explainable risk snapshot)
- `POST /api/projects` (government)
- `POST /api/projects/:id/release-funds` (government)
- `POST /api/projects/:id/proofs` (contractor)
- `POST /api/projects/:id/analyze` (government manual trigger)

Users:
- `GET /api/users` (government)
- `PUT /api/users/:id/role` (government)

Analytics:
- `GET /api/analytics`

## 7. Security/Validation Highlights

Proof uploads now include integrity checks:
- minimum file-size checks by MIME type
- signature checks for JPEG/PNG/PDF/DOCX
- invalid files rejected with `PROOF_INVALID_CONTENT`

General safety:
- RBAC guards on sensitive routes
- explicit validation and structured error envelopes

## 8. Environment Setup

### 8.1 Backend .env

Create `backend/.env` from `backend/.env.example`.

```env
PORT=4001
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-super-secret-jwt-key"

# IPFS (optional)
PINATA_API_KEY=""
PINATA_SECRET_API_KEY=""

# Blockchain (optional)
POLYGON_RPC_URL="https://rpc-amoy.polygon.technology/"
CONTRACT_ADDRESS=""
PRIVATE_KEY=""

# Risk scheduler interval
AI_CRON_INTERVAL_HOURS=6
```

Notes:
- Empty Pinata keys => mock CID behavior.
- Empty contract/private key => mock blockchain tx behavior.
- Risk scoring is local and does not require paid API credentials.

### 8.2 Frontend .env

```env
VITE_API_BASE_URL=http://localhost:4001/api
```

## 9. Run Locally

Backend:

```powershell
cd backend
npm install
npm run setup:free
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Build checks:

```powershell
cd backend
npm run build

cd ../frontend
npm run build
```

## 10. Backend Scripts

- `npm run dev`
- `npm run build`
- `npm run prisma:generate`
- `npm run db:push`
- `npm run db:seed`
- `npm run setup:free`
- `npm run contract:compile`
- `npm run contract:deploy:amoy`

## 11. Demo Accounts

- `gov@demo.com`
- `build@demo.com`
- `citizen@demo.com`

Password used in local demo flows: `demo123`

## 12. UI/UX (Current)

Implemented frontend improvements:
- modern analytics-style visual language
- card-first layout with soft shadows and rounded containers
- risk/status badges and dual progress bars
- searchable/sortable fund release table
- enhanced skeleton states and error banners
- responsive desktop/tablet behavior

## 13. Troubleshooting

### Frontend cannot load data
- verify `VITE_API_BASE_URL`
- verify backend health: `GET /health`

### Vite dev server port issues
- stop process using 5173
- rerun `npm run dev`

### Proof upload fails
- check file type and integrity
- ensure uploaded file is a valid JPEG/PNG/PDF/DOCX and not a tiny/corrupt placeholder

### Blockchain tx failures
- verify `CONTRACT_ADDRESS`, `PRIVATE_KEY`, and Amoy balance

### Prisma Windows EPERM
- stop locking Node processes and rerun `npm run prisma:generate`

## 14. Security Notes

- Never commit `.env` secrets.
- Rotate exposed API keys immediately.
- Use restricted-scope keys for external providers.
- Use a dedicated low-risk wallet for testnet operations.

## 15. Additional Docs

- `architecture_roadmap.md`
- `ux_screen_breakdown.md`
- `SETUP_FREE_TIER.md`
