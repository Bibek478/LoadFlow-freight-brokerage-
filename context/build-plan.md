# Build Plan

**Budget: under 24 hours, solo. Target ~16 active hours for all must-haves + deploy + walkthrough, leaving buffer for debugging and breaks. Stretch features only if you finish early.**

## Core Principle for This Build

Not every feature gets a full "mock UI first, wire logic later" pass — that pattern (used on slower builds) costs two passes over the same feature and there isn't time for that here. Instead:

- **RBAC (Phase 1) and the Load state machine (Phase 3)** are built and tested as **logic first** — via `curl`/a test script, no UI — because bugs in these two systems are expensive to find once a UI is sitting on top of them, and they're the parts actually being graded most closely.
- **Everything else** (compliance records, rate confirmations, dashboards, load board) is built **UI + logic together** in a single pass per feature — faster, and the UI is a fine test surface for straightforward CRUD.

Commit after every numbered feature below, with the feature number in the message (e.g. `04: staff and role management`). That commit trail is your "AI usage kept visible" evidence.

---

## Phase 0 — Setup & Deploy Skeleton (~45 min)

- `create-next-app` (TS, App Router, Tailwind), shadcn init
- Install Mongoose: `npm install mongoose`
- Create `lib/db.ts` connection singleton (see library-docs.md)
- Create all model files in `lib/models/` per architecture.md schema (Org, User, Role, CarrierComplianceRecord, Load, AccessDeniedLog) — run a quick `connectDB()` smoke-test to confirm Atlas connectivity before writing any feature code
- Push to GitHub, deploy to Vercel — confirm the empty app is live at a public URL **before writing any feature code**
- Set env vars on Vercel (`MONGODB_URI`, `JWT_SECRET`)

---

## Phase 1 — Auth & RBAC Core (backbone)

### 01 Data model — *logic* (~30 min)
All model files in `lib/models/` per architecture.md: Org, User, Role, CarrierComplianceRecord, Load (with embedded `statusHistory` and `rateConfirmations` subdocuments), AccessDeniedLog. No migrations needed — run a `connectDB()` smoke-test to confirm Atlas connectivity.

### 02 Auth logic — *logic* (~1.5 hr)
- `lib/auth.ts` — hash/verify password, JWT sign/verify, session cookie
- `POST /api/auth/signup/broker`, `/signup/carrier` — create Org + User (`is_org_admin: true`) in one transaction
- `POST /api/auth/signup/shipper` — create User only, no org
- `POST /api/auth/login` — verify password, resolve permissions (via role if any), bake into JWT
- `POST /api/auth/logout`
- Test all four with `curl` before building any form

### 03 RBAC engine — *logic* (~1 hr)
- `lib/rbac.ts` — `hasPermission`, `requirePermission`, `scopeLoadsWhere` (and equivalents for compliance/staff), `logAccessDenied`
- Write one throwaway test script that: logs in as a Carrier staff user, calls a broker-only endpoint stub, confirms 403 + a row lands in `AccessDeniedLog`. This is the single most important thing to get right before building UI on top of it.

### 04 Staff & Role management — *UI + logic combined* (~2 hr)
- `/staff` page — Admin only (check `isOrgAdmin` server-side, not just hide the nav link)
- Role builder: name + checkbox list of permissions filtered by org_type (from project-overview.md's assignability table)
- Staff creation form: name, email, temp password, role dropdown — creates the account immediately, shows temp password once
- `POST /api/roles`, `GET /api/roles`, `POST /api/staff`, `GET /api/staff` — all behind `staff.manage`
- **Seed data while here**: for your own demo, create the example roles from project-overview.md (Dispatcher, Ops Lead, Driver, Carrier Dispatch) so the walkthrough has something to show immediately

---

## Phase 2 — Compliance & Rate Data

### 05 Carrier compliance record CRUD — *UI + logic combined* (~1 hr)
- `/compliance` page, Carrier org only
- Form: insurance expiry date, MC/DOT status dropdown, approved equipment types, approved commodity types
- `GET/PUT /api/compliance` — scoped to the logged-in carrier's own org, no permission gate needed beyond "is carrier staff" (compliance data isn't in the permission catalog — any carrier staff can view it, only relevant permission would be staff.manage-adjacent, but brief doesn't require gating this specifically — keep it simple: any authenticated carrier org member can view/edit)

### 06 Rate confirmation versioning — *logic first, then thin UI* (~1.25 hr)
- Logic: `POST /api/rate-confirmations` — behind `rate.confirm`, creates new version per the transaction pattern in library-docs.md, repoints `Load.currentRateConfirmationId`
- Test with `curl`: confirm twice on the same load, confirm both versions persist and only the latest is `isCurrent`
- UI: simple panel on the load detail page (built fully in feature 08) — for now just get the API right

---

## Phase 3 — Load Lifecycle

### 07 Load CRUD + state machine + compliance auto-flag — *logic* (~2 hr)
- `lib/state-machine.ts` — `ALLOWED_TRANSITIONS` map, `canTransition()`
- `POST /api/loads` (`load.create`), `GET /api/loads` (scoped list)
- `POST /api/loads/[id]/assign` (`load.assign_carrier`) — sets carrier, runs the compliance check from architecture.md, sets `compliance_flagged`/reason
- `POST /api/loads/[id]/status` (`load.update_status`) — validates via `canTransition`, rejects `CARRIER_ASSIGNED → RATE_CONFIRMED` while flagged
- `POST /api/loads/[id]/override` (`load.override_compliance_flag`) — clears flag, writes audit note
- Test the whole lifecycle with `curl` end to end, including the blocked-then-overridden path, before touching UI

### 08 Load workflow UI — *UI on top of 06+07* (~2 hr)
- `/loads/[id]` — status badge, compliance flag banner, status action buttons (only the ones the user's permissions allow), audit trail list, rate confirmation panel (current + past versions)
- `/loads` new-load form (`load.create`)
- Buttons call the routes from feature 07/06 — no new backend logic here, just wiring

---

## Phase 4 — Dashboards & Search

### 09 Broker dashboard + load board search/filter — *UI + logic combined* (~1.5 hr)
- `/dashboard` (broker view): a few stat counts (total loads, flagged loads, in-transit) + recent loads list
- `/loads`: full scoped table, text search (company/shipper/route), status filter dropdown

### 10 Carrier dashboard — *UI + logic combined* (~45 min)
- Assigned loads list (scoped to carrier org), status action shortcuts inline

### 11 Shipper dashboard — *UI + logic combined* (~30 min)
- Read-only list of the shipper's own loads with current status

---

## Phase 5 — Deploy Polish & Walkthrough (~1 hr)

- Full redeploy, click through all three account types on the live URL
- Write the walkthrough: what's built, stack + one-line reasons (copy from architecture.md), a short note on where AI tooling was used session-by-session, and the one deliberate simplification you made under time pressure (permissions baked into JWT at login — see library-docs.md)
- Update progress-tracker.md to final state

---

## Stretch — only attempt after Phase 5 is done and deployed

### 12 POD upload/viewer (~1 hr)
`POST /api/loads/[id]/pod` behind `pod.upload`, Vercel Blob, transitions to `POD_VERIFIED`.

### 13 Compliance expiry renewal alerts (~30 min)
Banner on carrier dashboard + broker load board when `insurance_expiry` is within 30 days.

### 14 Audit log viewer (~45 min)
Standalone page reading `AccessDeniedLog` + `LoadStatusHistory` across the org, admin only.

---

## Scope-Cut Priority List (use live if you're behind schedule)

Cut in this order. Never cut anything below the line — those are the graded core.

1. Drop all three stretch features (12, 13, 14) entirely
2. Drop dashboard stat-count cards — scoped lists alone are enough
3. Drop the status dropdown filter on the load board — keep text search only
4. Reduce equipment/commodity types from free-form tags to a small fixed picklist (still correct logic, far less UI work)
5. Flatten `accessorials` to a single "extra charges" number instead of an itemized array — still versioned, still base+extra, just simpler to build

**Never cut, no matter how late it gets:** the three account types with real auth, admin-built custom roles via UI, server-side permission enforcement on every route, org + object-level scoping, the load state machine, the audit trail, and compliance auto-flagging that blocks progression. These are the entire point of the "hard" difficulty rating — a demo without them is a different, easier project.
