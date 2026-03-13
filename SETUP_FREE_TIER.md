# InfraLedger Free-Tier Setup (Step by Step)

This guide sets up the project end-to-end using only free services.

## 1) Prerequisites

1. Install Node.js 20+.
2. Install npm (comes with Node).
3. No paid API keys are required.

## 2) Backend Setup (Free Mode)

1. Open a terminal in `backend/`.
2. Copy env template:

```powershell
Copy-Item .env.example .env
```

3. Keep these values empty for free local mode:

- `PINATA_API_KEY=""`
- `PINATA_SECRET_API_KEY=""`
- `CONTRACT_ADDRESS=""`
- `PRIVATE_KEY=""`

In this mode:
- IPFS uses mock CID fallback.
- Blockchain uses mock tx hash fallback.
- AI uses built-in heuristic scoring.

4. Install backend dependencies:

```powershell
npm install
```

5. Initialize DB + seed demo users:

```powershell
npm run setup:free
```

6. Start backend:

```powershell
npm run dev
```

Backend runs on `http://localhost:4000`.

## 3) Frontend Setup

1. Open a terminal in `frontend/`.
2. Create `.env` with API base URL:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

3. Install frontend dependencies:

```powershell
npm install
```

4. Start frontend:

```powershell
npm run dev
```

Frontend runs on `http://localhost:5173` or next available port.

## 4) Demo Login Users

Seed script creates:

1. `gov@demo.com`
2. `build@demo.com`
3. `citizen@demo.com`

Password is not validated in current MVP login route, so enter any non-empty value.

## 5) Verify End-to-End Flow

1. Login as `gov@demo.com`.
2. Create a project.
3. Release funds.
4. Login as `build@demo.com` and upload proof.
5. Open project detail/public dashboard and confirm:
- Risk score updates (heuristic AI).
- Proof entries appear.
- Transaction hash/CID appear (mock values in free mode).

## 6) Optional Free External Integrations

These are still free-tier if you want real external proofs:

1. Pinata Free Tier: add `PINATA_API_KEY` and `PINATA_SECRET_API_KEY`.
2. Polygon Amoy Testnet: add `CONTRACT_ADDRESS` + `PRIVATE_KEY` + test MATIC from faucet.

If omitted, app stays fully functional in local demo mode using built-in fallbacks.

## 7) Common Fixes

1. If backend DB gets out of sync:

```powershell
npm run db:push
npm run db:seed
```

2. If frontend cannot call backend:
- Ensure `VITE_API_BASE_URL=http://localhost:4000/api`.
- Ensure backend terminal is running.

3. If port is in use:
- Vite auto-selects another port.
- Use the URL printed in terminal.
