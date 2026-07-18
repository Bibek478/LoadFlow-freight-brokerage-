# Architecture

## Stack

| Layer | Tool | Purpose | Why |
|---|---|---|---|
| Framework | Next.js 15 (App Router), TypeScript strict | Full stack — pages + API in one repo | One language, one deploy, fastest path for a solo 24h build |
| Database | MongoDB (MongoDB Atlas free tier) | All persistent data | Serverless-deploy safe; document model lets statusHistory and rateConfirmations embed directly in Load, removing transaction-wrapping code for those writes |
| ODM | Mongoose | Schema, models, queries | Schema validation without migrations; faster iteration under time pressure; embedded arrays replace the Postgres join tables for audit trail and rate versioning |
| Auth | Custom — bcrypt + JWT (`jose`) in httpOnly cookie | Session + identity | RBAC needs a custom session payload (org id, org type, admin flag, permissions); a generic auth library fights this more than it helps |
| Styling | Tailwind CSS + shadcn/ui | All UI | Fast to build, consistent, no design-from-scratch needed |
| File storage (stretch) | Vercel Blob | POD upload | Zero-config on Vercel, no separate account/bucket setup |
| Deployment | Vercel (app) + MongoDB Atlas (DB) | Hosting | Both free, both git-push deploys, zero infra work |

No AI/ML API is used in the product. The brief's AI-tool requirement is about the *development process* (commits/notes showing Claude/Cursor usage), not an in-app feature.

---

## Folder Structure

```
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── lib/
│   ├── db.ts                               → Mongoose connection singleton
│   ├── models/
│   │   ├── Org.ts
│   │   ├── User.ts
│   │   ├── Role.ts
│   │   ├── CarrierComplianceRecord.ts
│   │   ├── Load.ts                         → embeds statusHistory[] and rateConfirmations[]
│   │   └── AccessDeniedLog.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx                            → Landing, redirects based on session
│   ├── login/page.tsx
│   ├── signup/
│   │   ├── broker/page.tsx
│   │   ├── carrier/page.tsx
│   │   └── shipper/page.tsx
│   ├── dashboard/page.tsx                  → Renders BrokerDashboard | CarrierDashboard | ShipperDashboard by session org_type
│   ├── loads/
│   │   ├── page.tsx                        → Broker load board (search/filter) — broker only, redirects others
│   │   └── [id]/page.tsx                   → Load detail — status actions vary by permission
│   ├── staff/page.tsx                      → Staff + role management — org_admin only
│   ├── compliance/page.tsx                 → Carrier compliance record — carrier only
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── signup/[orgType]/route.ts
│       ├── staff/route.ts                  → GET list, POST create (staff.manage)
│       ├── roles/route.ts                  → GET list, POST create (staff.manage)
│       ├── compliance/route.ts             → GET/PUT carrier's own compliance record
│       ├── loads/
│       │   ├── route.ts                    → GET (scoped list), POST create (load.create)
│       │   └── [id]/
│       │       ├── route.ts                → GET one (scoped)
│       │       ├── assign/route.ts         → POST assign carrier (load.assign_carrier) — runs compliance check
│       │       ├── status/route.ts         → POST status transition (load.update_status)
│       │       ├── override/route.ts       → POST override compliance flag (load.override_compliance_flag)
│       │       └── pod/route.ts            → POST upload POD (pod.upload) — stretch
│       └── rate-confirmations/
│           └── route.ts                    → POST new version (rate.confirm), GET history for a load
│   ├── auth.ts                             → bcrypt hashing, JWT sign/verify, session cookie helpers
│   ├── rbac.ts                             → hasPermission(), requirePermission(), scope*() helpers, logAccessDenied()
│   ├── state-machine.ts                    → Load status transition table + validation
│   └── utils.ts                            → shared helpers
├── components/
│   ├── ui/                                 → shadcn/ui components only
│   ├── layout/Navbar.tsx
│   ├── dashboard/
│   │   ├── BrokerDashboard.tsx
│   │   ├── CarrierDashboard.tsx
│   │   └── ShipperDashboard.tsx
│   ├── staff/{StaffList,RoleBuilder,StaffForm}.tsx
│   ├── loads/{LoadBoard,LoadForm,LoadStatusActions,ComplianceFlagBanner,AuditTrail,RateConfirmationPanel}.tsx
│   └── compliance/ComplianceForm.tsx
└── types/
    └── index.ts
```

---

## System Boundaries

| Folder | Owns |
|---|---|
| `app/` | Pages and API routes only. No business logic inline in route handlers beyond calling `lib/`. |
| `lib/rbac.ts` | The single source of truth for "can this user do this." Every route handler imports from here. Nothing else defines permission logic. |
| `lib/state-machine.ts` | The single source of truth for valid Load status transitions. Nothing else hardcodes a transition. |
| `components/` | UI only. No direct Prisma calls, no permission logic — components trust that the API already enforced access and just render what they got. |
| `lib/models/` | All data shape. One Mongoose model file per collection. |

---

## Data Flow

### Every mutation, no exceptions

```
Client action
     ↓
app/api/.../route.ts
     ↓
getSessionUser(req)              — lib/auth.ts, from JWT cookie
     ↓
requirePermission(user, 'x.y')   — lib/rbac.ts, throws 403 + logs denial if missing
     ↓
scope*(user, ...)                — lib/rbac.ts, narrows query to user's org / own records
     ↓
(for load status changes) validateTransition() — lib/state-machine.ts
     ↓
Mongoose write — for Load status changes: push to load.statusHistory[] and save in one document write (atomic at the document level). For cross-collection writes that must be atomic, use a MongoDB session (db.startSession() / session.withTransaction()).
     ↓
JSON response { success, data? , error? }
```

This exact chain applies even to "obviously safe" reads like `GET /api/loads` — scoping happens there too, not just on writes.

---

## Database Schema (Mongoose)

### Collection: `orgs`
```typescript
{
  _id: ObjectId,
  type: 'BROKER' | 'CARRIER',   // Org can never be SHIPPER
  name: string,
  createdAt: Date,
}
```

### Collection: `users`
```typescript
{
  _id: ObjectId,
  orgId: ObjectId | null,        // null for shippers
  orgType: 'BROKER' | 'CARRIER' | 'SHIPPER',
  email: string,                 // unique index
  passwordHash: string,
  name: string,
  isOrgAdmin: boolean,           // true → implies every permission for that orgType
  roleId: ObjectId | null,       // ref: roles; null for admins and shippers
  createdAt: Date,
}
```

**Security invariant replacing FK constraints:** `orgId` and `roleId` are never sourced from a request body. The signup route resolves them from its own logic; every other route resolves them from `getSessionUser()`. When assigning a carrier (`carrierOrgId`), the route must query the Org collection to confirm the ID exists and has `type: 'CARRIER'` before writing — this is the code-level FK check that replaces Postgres' referential integrity.

### Collection: `roles`
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,               // always scoped to one org
  orgType: 'BROKER' | 'CARRIER',
  name: string,
  permissions: Permission[],     // array of the 7 fixed permission strings
  createdAt: Date,
}
```

`RolePermission` is no longer a separate collection — permissions are embedded directly in the role document.

### Collection: `carrier_compliance_records`
```typescript
{
  _id: ObjectId,
  carrierOrgId: ObjectId,        // unique index — one record per carrier
  insuranceExpiry: Date,
  mcDotStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED',
  approvedEquipmentTypes: string[],
  approvedCommodityTypes: string[],
  updatedAt: Date,
}
```

### Collection: `loads` (embeds audit trail and rate confirmations)
```typescript
{
  _id: ObjectId,
  brokerOrgId: ObjectId,
  shipperId: ObjectId,
  carrierOrgId: ObjectId | null,
  status: LoadStatus,
  origin: string,
  destination: string,
  commodityType: string,
  equipmentType: string,
  pickupDate: Date,
  deliveryDate: Date | null,
  complianceFlagged: boolean,
  complianceFlagReason: string | null,
  podUrl: string | null,
  createdAt: Date,
  updatedAt: Date,

  // Embedded audit trail — replaces LoadStatusHistory collection
  statusHistory: [
    {
      fromStatus: LoadStatus | null,   // null on first create
      toStatus: LoadStatus,
      changedByUserId: ObjectId,
      changedAt: Date,
      note: string | null,
    }
  ],

  // Embedded rate confirmations — replaces RateConfirmation collection
  rateConfirmations: [
    {
      version: number,
      baseRate: number,
      accessorials: { description: string; amount: number }[],
      totalRate: number,           // computed on write: base + sum(accessorials)
      confirmedByUserId: ObjectId,
      confirmedAt: Date,
      isCurrent: boolean,          // only one true per load at a time
    }
  ],
}
```

Embedding statusHistory and rateConfirmations inside Load means:
- A status change + audit entry is a single `findOneAndUpdate` with `$push` to `statusHistory` — no cross-collection transaction needed.
- Rate versioning: set all `rateConfirmations[].isCurrent = false` then push the new version in one update.
- "Old loads show the version confirmed at the time" is trivially preserved — the entire history is in the document.

Old `rateConfirmations` entries are never mutated — insert-only semantics still apply.

### Collection: `access_denied_logs`
```typescript
{
  _id: ObjectId,
  userId: ObjectId | null,       // null if unauthenticated
  attemptedPermission: string,
  route: string,
  createdAt: Date,
}
```

Query this collection for the stretch "audit log viewer."

---

## Load State Machine

```
POSTED
  → CARRIER_ASSIGNED        (load.assign_carrier — runs compliance check, may set compliance_flagged)
CARRIER_ASSIGNED
  → RATE_CONFIRMED          (rate.confirm — BLOCKED if compliance_flagged=true, unless load.override_compliance_flag was used first)
  → POSTED                  (load.update_status, carrier side — "decline assignment", clears carrier_org_id)
RATE_CONFIRMED
  → DISPATCHED              (load.update_status)
DISPATCHED
  → IN_TRANSIT              (load.update_status)
IN_TRANSIT
  → DELIVERED               (load.update_status)
DELIVERED
  → POD_VERIFIED            (pod.upload — stretch; without POD feature built, load.update_status can move this directly)
POD_VERIFIED
  → INVOICED_CLOSED         (load.update_status)
```

No other transitions are valid. `lib/state-machine.ts` exports a single `ALLOWED_TRANSITIONS` map and a `canTransition(from, to)` function — every status-changing route calls this before writing. This is the one piece of business logic that is genuinely risky to get wrong under time pressure, which is why build-plan.md has it built and tested as logic before any UI touches it.

### Compliance auto-flag logic

Triggered inside the `assign` route, right after `carrier_org_id` is set:

```
record = CarrierComplianceRecord for carrier_org_id
flagged = record == null
       || record.insurance_expiry < today
       || record.mc_dot_status != 'ACTIVE'
       || load.equipment_type not in record.approved_equipment_types
       || load.commodity_type not in record.approved_commodity_types

Load.compliance_flagged = flagged
Load.compliance_flag_reason = <specific reason string> or null
```

While `compliance_flagged = true`, the `CARRIER_ASSIGNED → RATE_CONFIRMED` transition is rejected by `state-machine.ts` unless the request carries a valid override — a user with `load.override_compliance_flag` calls the dedicated `override` route first, which sets `compliance_flagged = false`, writes a `LoadStatusHistory`-style audit note explaining the override, and only then does the normal transition succeed. The override is never silent.

---

## RBAC Enforcement Pattern

```typescript
// lib/rbac.ts
export type Permission =
  | 'load.create' | 'load.assign_carrier' | 'load.override_compliance_flag'
  | 'rate.confirm' | 'load.update_status' | 'staff.manage' | 'pod.upload';

export async function hasPermission(user: SessionUser, permission: Permission): Promise<boolean> {
  if (user.orgType === 'SHIPPER') return false; // shippers never hold permissions
  if (user.isOrgAdmin) return true;              // admin implies every permission for their org type
  return user.permissions.includes(permission);  // loaded onto the session at login
}

export async function requirePermission(user: SessionUser | null, permission: Permission, route: string) {
  if (!user || !(await hasPermission(user, permission))) {
    await logAccessDenied(user?.id ?? null, permission, route);
    throw new ApiError(403, 'Not authorized');
  }
}

// Object-level scoping — always applied, independent of permissions
export function scopeLoadsWhere(user: SessionUser) {
  if (user.orgType === 'SHIPPER') return { shipper_id: user.id };
  if (user.orgType === 'CARRIER') return { carrier_org_id: user.orgId };
  return { broker_org_id: user.orgId }; // BROKER
}
```

Every `app/api/**/route.ts` handler follows: authenticate → `requirePermission` (skip only for pure scoped reads that don't gate on a specific permission, e.g. "view my own loads") → `scope*` the query → do the work.

---

## Invariants

- No route handler queries `Load`, `RateConfirmation`, or `CarrierComplianceRecord` without a `scope*()` clause from `lib/rbac.ts`.
- No permission check ever compares against a role name string. Only permission strings.
- Every `Load.status` write goes through `canTransition()` in `lib/state-machine.ts`.
- Every `Load.status` write pushes a `statusHistory` entry in the same `findOneAndUpdate` call — never a status change without an audit entry in the embedded array.
- Compliance override always writes a note to the audit trail — never a silent flag clear.
- `RateConfirmation` rows are insert-only. No `UPDATE` on an existing version, ever.
- `User.isOrgAdmin = true` and `User.roleId != null` never co-occur.
- Passwords are never stored or logged in plaintext, anywhere, including console.log during debugging.
