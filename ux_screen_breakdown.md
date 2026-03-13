# InfraLedger V1 — UX Screen Breakdown

> Minimal, clean, scalable. Usability over decoration.

---

## Screen Map

| # | Route | Screen | Auth | Roles |
|---|---|---|---|---|
| 1 | `/` | Public Dashboard | No | Anyone |
| 2 | `/project/:id` | Project Detail | No | Anyone |
| 3 | `/login` | Login | No | Anyone |
| 4 | `/dashboard` | Auth Home | Yes | Gov / Contractor |
| 5 | `/projects/new` | Create Project | Yes | Government |
| 6 | `/projects/:id/funds` | Fund Release (modal) | Yes | Government |
| 7 | `/projects/:id/proof` | Upload Proof | Yes | Contractor |
| 8 | `/admin` | Admin Panel | Yes | Admin (seeded) |

---

## 1. Public Dashboard — `/`

**Purpose:** Citizen-facing entry point. Zero friction. No login wall.

### Layout Hierarchy

```
┌─────────────────────────────────────────────────┐
│ TopBar                                          │
│  Logo · "InfraLedger" · [Login] button (right)  │
├─────────────────────────────────────────────────┤
│ HeroBanner                                      │
│  Headline: "Track Public Infrastructure Spending"│
│  Subtext: "Every rupee. Verified on blockchain." │
│  Stats row: [Total Projects] [Total Funds] [Proofs Uploaded] │
├─────────────────────────────────────────────────┤
│ FilterBar                                       │
│  [Search by name/location] [Status ▾] [Budget ▾]│
├─────────────────────────────────────────────────┤
│ ProjectList                                     │
│  ┌─────────────────────────────────────────┐    │
│  │ ProjectCard                             │    │
│  │  Name · Location · Status badge         │    │
│  │  Budget bar: ₹Released / ₹Total         │    │
│  │  Risk badge (green/yellow/red)          │    │
│  │  Proof count · Last updated             │    │
│  └─────────────────────────────────────────┘    │
│  ... repeats (paginated, 20/page)               │
├─────────────────────────────────────────────────┤
│ Pagination: [← Prev] Page 1 of 8 [Next →]      │
├─────────────────────────────────────────────────┤
│ Footer: "Powered by Polygon · IPFS · Open Data" │
└─────────────────────────────────────────────────┘
```

### Components

| Component | Behavior |
|---|---|
| **TopBar** | Sticky. Logo links to `/`. Login button → `/login`. After auth, shows user avatar + role badge |
| **HeroBanner** | Static text + 3 live stat counters from `GET /api/v1/analytics/dashboard` |
| **FilterBar** | Client-side search (debounced 300ms). Status dropdown: All / Active / Completed / Flagged. Budget range slider |
| **ProjectCard** | Clickable → `/project/:id`. Shows: name, location, budget progress bar, risk badge, proof count |
| **Pagination** | Page-based. Driven by `?page=N&limit=20` query params |

### Empty State
> **Illustration:** Simple building icon with dotted outline
> **Headline:** "No projects tracked yet"
> **Subtext:** "Infrastructure projects will appear here once registered."
> No action button (citizens can't create projects)

### Error State
> **Banner (top of list area, dismissible):**
> "Unable to load projects. Please try again."
> **[Retry]** button re-fetches `GET /api/v1/projects`

### Loading State
> 6 skeleton `ProjectCard` placeholders with pulsing animation

---

## 2. Project Detail — `/project/:id`

**Purpose:** Full transparency view of a single project. Citizen's primary verification screen.

### Layout Hierarchy

```
┌─────────────────────────────────────────────────┐
│ TopBar (same as Dashboard)                      │
├─────────────────────────────────────────────────┤
│ Breadcrumb: Projects > NH-44 Bypass Road        │
├─────────────────────────────────────────────────┤
│ ProjectHeader                                   │
│  Name · Location · Status badge · Risk badge    │
│  Contractor name · Timeline (start → end)       │
│  [Share 🔗] button (copies URL)                 │
├──────────────────────┬──────────────────────────┤
│ LEFT COL (60%)       │ RIGHT COL (40%)          │
│                      │                          │
│ BudgetCard           │ RiskCard                 │
│  Pie chart:          │  Score: 0.23 (Normal)    │
│  Released vs          │  Badge: 🟢 green         │
│  Remaining           │  "Low risk indicators"   │
│                      │  Features table:         │
│ SpendingTimeline     │   funds_pct, proofs, etc│
│  Line chart:         │                          │
│  Cumulative spend    ├──────────────────────────┤
│  over time           │ BlockchainRecords        │
│                      │  Tx hash (linked) →      │
├──────────────────────┤  polygonscan             │
│ FundReleaseTable     │  Block # · Timestamp     │
│  Date | Amount |     │  ... list                │
│  Purpose | Tx hash   │                          │
│  ... rows            │                          │
├──────────────────────┴──────────────────────────┤
│ ProofGallery                                    │
│  Section header: "Work Proof (12 files)"        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ thumb│ │ thumb│ │ thumb│ │ thumb│ ...       │
│  │ .jpg │ │ .png │ │ .pdf │ │ .jpg │          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
│  Click → Lightbox (full image + IPFS hash +     │
│          "Verify on IPFS" link)                 │
├─────────────────────────────────────────────────┤
│ Footer                                          │
└─────────────────────────────────────────────────┘
```

### Components

| Component | Behavior |
|---|---|
| **Breadcrumb** | `Projects` links to `/`. Current project name shown (truncated at 40 chars) |
| **ProjectHeader** | Static data from `GET /api/v1/projects/:id`. Share button uses `navigator.clipboard` |
| **BudgetCard** | Recharts `PieChart` — two segments: Released (blue) vs Remaining (gray). Center label shows percentage |
| **SpendingTimeline** | Recharts `LineChart` — X: dates, Y: cumulative ₹ released. Data from transactions list |
| **RiskCard** | Score 0–1 displayed with color-coded badge. Features table shows the 5 AI input features |
| **FundReleaseTable** | Sortable table. Tx hash column links to `https://amoy.polygonscan.com/tx/{hash}` (opens new tab) |
| **ProofGallery** | Grid of thumbnails (4 per row desktop, 2 mobile). Click opens lightbox overlay |
| **Lightbox** | Full-size image. Shows: filename, upload date, IPFS CID, "Verify on IPFS" external link, [Close] |

### Empty States

| Section | Empty State |
|---|---|
| **FundReleaseTable** | "No funds released yet." — single row message |
| **ProofGallery** | "No work proof uploaded." — placeholder icon |
| **RiskCard** | "Not yet analyzed" — gray badge, no score |
| **SpendingTimeline** | Chart area shows "No spending data" centered text |

### Error States
- **404 project:** Full-page "Project not found. [Back to Dashboard]"
- **Partial load failure (e.g. proofs fail):** Section shows inline error: "Failed to load proof files. [Retry]"
- **IPFS gateway slow:** Thumbnail shows spinner → 10s timeout → placeholder image with "Image unavailable"
- **Polygonscan link down:** Tx hash displayed as plain text with tooltip: "Explorer temporarily unavailable"

### Responsive
- Below 768px: single column layout, right column stacks below left
- Charts resize to container width
- Proof gallery switches to 2-column grid

---

## 3. Login — `/login`

**Purpose:** Single entry point for Government and Contractor users.

### Layout Hierarchy

```
┌─────────────────────────────────────────────────┐
│ TopBar (Logo only, no login button)             │
├─────────────────────────────────────────────────┤
│                                                 │
│          ┌──────────────────────┐               │
│          │ LoginCard            │               │
│          │                      │               │
│          │  InfraLedger logo    │               │
│          │  "Sign in to your    │               │
│          │   account"           │               │
│          │                      │               │
│          │  [Email input]       │               │
│          │  [Password input]    │               │
│          │                      │               │
│          │  [Sign In] button    │               │
│          │                      │               │
│          │  "View public        │               │
│          │   dashboard →"       │               │
│          └──────────────────────┘               │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components

| Component | Behavior |
|---|---|
| **LoginCard** | Centered vertically and horizontally. Max-width 400px |
| **Email input** | Type `email`, required, autofocus. Validation: valid email format |
| **Password input** | Type `password`, required, min 6 chars. Show/hide toggle icon |
| **Sign In button** | Calls Firebase `signInWithEmailAndPassword()`. Shows spinner during auth. Disabled while loading |
| **Public dashboard link** | Text link → `/`. For citizens who landed here accidentally |

### Interaction Logic
1. User fills email + password → clicks **Sign In**
2. Firebase SDK authenticates → returns `idToken`
3. Call `POST /api/v1/auth/verify` with token → get `{role, displayName}`
4. Store `idToken` + `role` in React Context (memory only)
5. Redirect based on role:
   - `government` → `/dashboard`
   - `contractor` → `/dashboard`
   - `citizen` → `/` (public dashboard)

### Error States

| Condition | Display |
|---|---|
| Wrong credentials | Inline error below password field: "Invalid email or password" |
| Account disabled | "Your account has been deactivated. Contact administrator." |
| Network error | "Unable to reach authentication server. Check your connection." |
| Too many attempts | "Too many failed attempts. Try again in 5 minutes." |

All errors shown as red text below the form, not as alerts/popups.

---

## 4. Authenticated Dashboard — `/dashboard`

**Purpose:** Role-specific home after login. Shows relevant data and actions based on user role.

### Layout Hierarchy — Government Role

```
┌─────────────────────────────────────────────────┐
│ TopBar                                          │
│  Logo · NavLinks: [Dashboard] [Projects]        │
│  Right: Role badge "Government" · User name · [Logout] │
├─────────────────────────────────────────────────┤
│ WelcomeBanner                                   │
│  "Welcome back, {name}" · Last login timestamp  │
├─────────────────────────────────────────────────┤
│ StatCards (4-column grid)                        │
│  [Active Projects] [Total Budget] [Funds Released] [Flagged] │
├─────────────────────────────────────────────────┤
│ QuickActions                                    │
│  [+ Create Project] [View Flagged Projects]     │
├─────────────────────────────────────────────────┤
│ RecentActivity                                  │
│  Table: Date | Action | Project | Details       │
│  "Fund released: ₹50L for NH-44"               │
│  "New proof uploaded for Metro Phase 2"         │
│  ... last 10 activities                         │
├─────────────────────────────────────────────────┤
│ FlaggedProjects (if any)                        │
│  🔴 High Risk cards (condensed ProjectCard)     │
│  "3 projects require review"                    │
└─────────────────────────────────────────────────┘
```

### Layout Hierarchy — Contractor Role

```
┌─────────────────────────────────────────────────┐
│ TopBar                                          │
│  Logo · NavLinks: [Dashboard] [My Projects]     │
│  Right: Role badge "Contractor" · Name · [Logout] │
├─────────────────────────────────────────────────┤
│ WelcomeBanner                                   │
│  "Welcome back, {name}"                         │
├─────────────────────────────────────────────────┤
│ StatCards (3-column grid)                        │
│  [Assigned Projects] [Proofs Uploaded] [Total Funds Received] │
├─────────────────────────────────────────────────┤
│ MyProjects                                      │
│  ┌─────────────────────────────────────────┐    │
│  │ ProjectCard (contractor variant)        │    │
│  │  Name · Budget · Funds received         │    │
│  │  [Upload Proof] button                  │    │
│  └─────────────────────────────────────────┘    │
│  ... assigned projects only                     │
└─────────────────────────────────────────────────┘
```

### Components

| Component | Behavior |
|---|---|
| **TopBar** | Shows role badge (colored: Gov=blue, Contractor=orange). Logout clears Context + redirects to `/login` |
| **StatCards** | Each card: icon + label + number. Data from `GET /api/v1/analytics/dashboard` |
| **QuickActions** | Government: "Create Project" → `/projects/new`. "View Flagged" → filters project list. Contractor: hidden |
| **RecentActivity** | Last 10 events across user's projects. Each row is clickable → project detail |
| **FlaggedProjects** | Government only. Shows projects with `risk_level: 'high'`. Click → project detail |
| **MyProjects** | Contractor only. Filtered by `contractor_id`. Each card has "Upload Proof" → `/projects/:id/proof` |

### Empty States

| Section | Empty State |
|---|---|
| **RecentActivity** | "No recent activity. Create your first project to get started." |
| **FlaggedProjects** | "No flagged projects. All projects within normal risk parameters." ✅ |
| **MyProjects** (Contractor) | "No projects assigned yet. Contact your government administrator." |

---

## 5. Create Project — `/projects/new`

**Purpose:** Government official registers a new infrastructure project.

### Layout Hierarchy

```
┌─────────────────────────────────────────────────┐
│ TopBar (authenticated)                          │
├─────────────────────────────────────────────────┤
│ PageHeader                                      │
│  ← Back to Dashboard                           │
│  "Create New Project"                           │
├─────────────────────────────────────────────────┤
│ ProjectForm (max-width 640px, centered)         │
│                                                 │
│  Project Name *           [___________________] │
│  (max 200 chars)            123/200 char count  │
│                                                 │
│  Description               [___________________] │
│  (optional)                 textarea, 3 rows    │
│                                                 │
│  Total Budget (₹) *       [___________________] │
│  (auto-formats: 5,00,00,000)                    │
│                                                 │
│  Location *               [___________________] │
│  (max 300 chars)                                │
│                                                 │
│  Assigned Contractor *    [▾ Select contractor ] │
│  (dropdown, fetched from API)                   │
│                                                 │
│  Start Date *             [📅 _______________] │
│  End Date *               [📅 _______________] │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ ⚠ Duplicate Warning (conditional)       │    │
│  │ "A project named 'NH-44 Bypass' already │    │
│  │  exists. Continue anyway?"              │    │
│  │  [Cancel] [Continue]                    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [Cancel]              [Create Project →]       │
│                                                 │
├─────────────────────────────────────────────────┤
│ Footer                                          │
└─────────────────────────────────────────────────┘
```

### Interaction Logic

1. User fills all required fields
2. **Client-side validation** runs on blur and on submit:
   - Name: required, max 200 chars
   - Budget: required, positive number, no decimals (stored in paise)
   - Location: required, max 300 chars
   - Contractor: required, must select from dropdown
   - Start date: required, not in past
   - End date: required, must be after start date
3. On submit → check for duplicate name (fuzzy match via API or client-side list)
4. If duplicate found → show warning banner (user can dismiss and continue)
5. `POST /api/v1/projects` with form data
6. Show inline spinner on submit button, disable form
7. On success → redirect to `/project/:id` with success toast: "Project created successfully"
8. On failure → re-enable form, show error message

### Error States

| Condition | Display |
|---|---|
| Validation error | Red border on field + error text below: "Budget must be a positive number" |
| Blockchain tx failed | Modal: "Project saved but blockchain recording failed. It will retry automatically. [OK]" |
| Network error | Toast: "Unable to create project. Please try again." Form remains filled |
| No contractors available | Dropdown shows: "No contractors registered" — form cannot submit |

---

## 6. Fund Release — Modal on `/project/:id`

**Purpose:** Government releases funds for a project milestone. Opens as overlay modal on the project detail page.

### Layout Hierarchy

```
┌─────────── Overlay (dimmed background) ─────────┐
│                                                  │
│   ┌──────────────────────────────────────────┐   │
│   │ Modal Header                             │   │
│   │  "Release Funds" · [✕ Close]             │   │
│   ├──────────────────────────────────────────┤   │
│   │ ProjectSummary                           │   │
│   │  NH-44 Bypass Road                       │   │
│   │  Budget: ₹5,00,00,000                   │   │
│   │  Released: ₹1,50,00,000 (30%)           │   │
│   │  Remaining: ₹3,50,00,000               │   │
│   ├──────────────────────────────────────────┤   │
│   │ FundForm                                 │   │
│   │                                          │   │
│   │  Amount (₹) *    [___________________]   │   │
│   │  Max: ₹3,50,00,000                      │   │
│   │                                          │   │
│   │  Purpose *       [___________________]   │   │
│   │  (max 500 chars)                         │   │
│   │                                          │   │
│   │  Date            [March 13, 2026  📅]    │   │
│   │  (auto-filled, editable)                 │   │
│   │                                          │   │
│   ├──────────────────────────────────────────┤   │
│   │ ConfirmationStep (after clicking submit) │   │
│   │  "You are about to release ₹50,00,000   │   │
│   │   for 'Foundation work completed'."      │   │
│   │  ⚠ This action is recorded on blockchain │   │
│   │    and cannot be reversed.               │   │
│   │                                          │   │
│   │  [Cancel]        [Confirm Release]       │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Interaction Logic

1. Click "Release Funds" button on project detail (government only)
2. Modal opens with project budget summary pre-filled
3. User enters amount + purpose
4. **Validation:** Amount > 0, amount ≤ remaining budget, purpose required
5. Click "Submit" → **Confirmation step replaces form** (not a second modal)
6. User reviews summary → clicks "Confirm Release"
7. Button shows spinner: "Processing on blockchain..."
8. `POST /api/v1/projects/:id/funds`
9. On success → modal closes, project detail refreshes, success toast
10. On failure → show error in modal, allow retry

### Error States

| Condition | Display |
|---|---|
| Exceeds budget | Real-time: field turns red, text: "Exceeds remaining budget of ₹X" |
| Blockchain pending | Status in modal: "⏳ Transaction submitted. Waiting for confirmation..." |
| Blockchain failed | "Transaction failed. [Retry] or [Cancel]" — form data preserved |
| Network error | "Unable to reach server. Check your connection. [Retry]" |

---

## 7. Upload Proof — `/projects/:id/proof`

**Purpose:** Contractor uploads work completion evidence.

### Layout Hierarchy

```
┌─────────────────────────────────────────────────┐
│ TopBar (authenticated, contractor)              │
├─────────────────────────────────────────────────┤
│ PageHeader                                      │
│  ← Back to Project                             │
│  "Upload Work Proof" · Project: NH-44 Bypass    │
├─────────────────────────────────────────────────┤
│ UploadZone (max-width 640px, centered)          │
│  ┌─────────────────────────────────────────┐    │
│  │        📁                                │    │
│  │  Drag & drop files here                 │    │
│  │  or [Browse Files]                      │    │
│  │                                         │    │
│  │  JPG, PNG, PDF, DOCX · Max 10MB each    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│ FileList (appears after files selected)         │
│  ┌──────┬────────────────────┬──────┬──────┐   │
│  │ thumb│ site_photo_01.jpg  │ 2.4MB│  [✕] │   │
│  ├──────┼────────────────────┼──────┼──────┤   │
│  │ icon │ progress_report.pdf│ 1.1MB│  [✕] │   │
│  └──────┴────────────────────┴──────┴──────┘   │
│                                                 │
│ Description *        [___________________]      │
│ (max 500 chars)       "Week 3: 200m road base"  │
│                                                 │
│ [Cancel]                    [Upload Proof →]    │
│                                                 │
│ UploadProgress (during upload)                  │
│  site_photo_01.jpg  ████████████░░ 78%         │
│  progress_report.pdf  Queued...                 │
│                                                 │
│ UploadSuccess (after completion)                │
│  ✅ 2 files uploaded successfully               │
│  IPFS CID: Qm7x9...Kf3 · Recorded on blockchain│
│  [View in Project] [Upload More]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Interaction Logic

1. Drag files onto `UploadZone` or click "Browse Files"
2. **Validation (immediate):**
   - File type: only JPG, PNG, PDF, DOCX
   - File size: reject > 10MB with inline error per file
3. Files appear in `FileList` with thumbnails (images) or file-type icons (PDF/DOCX)
4. User can remove files with ✕ button
5. User writes description (required)
6. Click "Upload Proof" → sequential upload with progress bars
7. `POST /api/v1/projects/:id/proofs` (multipart form data)
8. Backend: Upload to Pinata → get CID → call smart contract → save to MongoDB
9. On success → show `UploadSuccess` with IPFS CID and blockchain confirmation
10. "View in Project" → `/project/:id` | "Upload More" → resets form

### Error States

| Condition | Display |
|---|---|
| Wrong file type | File row shows red: "Unsupported format. Only JPG, PNG, PDF, DOCX allowed" |
| File too large | File row shows red: "Exceeds 10MB limit (actual: 14.2MB)" — file not added |
| IPFS upload failed | Per-file error: "Upload failed for site_photo_01.jpg. [Retry]" |
| Blockchain recording failed | Warning: "Files stored on IPFS but blockchain recording pending. Will retry automatically." |
| No files selected | Submit button disabled. Tooltip: "Add at least one file" |

---

## 8. Admin Panel — `/admin`

**Purpose:** Seed user roles for demo. Minimal UI — not a full admin system.

### Layout Hierarchy

```
┌─────────────────────────────────────────────────┐
│ TopBar (authenticated)                          │
├─────────────────────────────────────────────────┤
│ PageHeader: "User Management"                   │
├─────────────────────────────────────────────────┤
│ UserTable (max-width 800px)                     │
│  Email           | Role         | Status | Action│
│  gov@demo.com   | Government ▾ | Active | [Save]│
│  build@demo.com | Contractor ▾ | Active | [Save]│
│  citizen@demo.com| Citizen    ▾ | Active | [Save]│
├─────────────────────────────────────────────────┤
│ Note: "Roles are assigned per user. Changes     │
│  take effect on next login."                    │
└─────────────────────────────────────────────────┘
```

- Role column: dropdown with `government`, `contractor`, `citizen`
- Save: `PATCH` user role in MongoDB
- V1 scope: pre-seed 3 demo users via script, admin UI is for adjustments only

---

## Global Components

### TopBar (Shared)

| State | Content |
|---|---|
| **Unauthenticated** | Logo + "InfraLedger" | [Login] button |
| **Authenticated** | Logo + Nav links (role-specific) | Role badge + User name + [Logout] |

### Toast Notifications

- Slide in from top-right. Auto-dismiss after 5 seconds.
- Types: **Success** (green), **Error** (red), **Warning** (yellow), **Info** (blue)
- Max 3 visible simultaneously. Stack vertically.

### Loading Pattern
- **Page load:** Full-page skeleton (matching layout structure)
- **Section load:** Section-level skeleton
- **Action load:** Button shows inline spinner, text changes to "Processing..."
- **Never:** blank screens, frozen UI, or unresponsive buttons

### Error Boundary (React)
- Catches unhandled errors at page level
- Shows: "Something went wrong. [Reload Page]"
- Logs error to console (production: to monitoring service)

---

## Responsive Breakpoints

| Breakpoint | Layout Changes |
|---|---|
| **≥ 1024px (Desktop)** | 2-column project detail, 4-column stat cards, sidebar nav (if needed) |
| **768–1023px (Tablet)** | 2-column stat cards, single-column project detail |
| **< 768px (Mobile)** | Single column everywhere. TopBar collapses to hamburger menu. Tables become card lists. Charts stack vertically |

---

## Interaction Summary Table

| Action | Trigger | Feedback | Result |
|---|---|---|---|
| View projects | Page load `/` | Skeleton → cards | Project list rendered |
| Search/filter | Type in search bar | Debounced 300ms filter | List updates |
| View project detail | Click card | Navigate + skeleton | Detail page loads |
| Login | Submit credentials | Button spinner | Redirect to `/dashboard` |
| Create project | Submit form | Spinner → toast | Redirect to project detail |
| Release funds | Confirm in modal | "Processing..." → toast | Modal closes, page refreshes |
| Upload proof | Submit files | Progress bars → success | CID displayed, project updated |
| Verify on IPFS | Click "Verify" link | Opens new tab | Pinata gateway shows file |
| Verify on blockchain | Click tx hash | Opens new tab | Polygonscan shows record |
| Logout | Click Logout | Immediate | Redirect to `/login` |
| Auto-refresh | Every 30 seconds | "Last updated" timestamp | Data refreshes silently |

---

## Data Polling & Refresh Strategy

| Screen | Strategy | Interval |
|---|---|---|
| Public Dashboard | `setInterval` poll | 30 seconds |
| Project Detail | `setInterval` poll | 30 seconds |
| Auth Dashboard | `setInterval` poll | 30 seconds |
| Create Project / Upload Proof | No polling | — |
| All screens | Manual refresh button | On demand |

Display **"Last updated: X seconds ago"** timestamp on all polling screens.

Cleanup: `clearInterval` on component unmount to prevent memory leaks.
