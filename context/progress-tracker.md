# Progress Tracker

Update this file after every completed feature. Any AI agent (or you, at hour 20) reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 3
**Last completed:** 08 Load workflow UI
**Next:** 09 Broker dashboard + load board search/filter
**Hours elapsed:** 10.75
**On track for full scope?** yes

---

## Progress

### Phase 0 — Setup

- [ ] Deployed empty skeleton to Vercel

### Phase 1 — Auth & RBAC Core

- [x] 01 Data model & migrations
- [x] 02 Auth logic (signup x3, login, logout)
- [x] 03 RBAC engine (tested via curl)
- [x] 04 Staff & role management UI

### Phase 2 — Compliance & Rate Data

- [x] 05 Carrier compliance record CRUD
- [x] 06 Rate confirmation versioning

### Phase 3 — Load Lifecycle

- [x] 07 Load CRUD + state machine + compliance auto-flag
- [x] 08 Load workflow UI

### Phase 4 — Dashboards & Search

- [ ] 09 Broker dashboard + load board search/filter
- [ ] 10 Carrier dashboard
- [ ] 11 Shipper dashboard

### Phase 5 — Deploy Polish & Walkthrough

- [ ] Final redeploy + click-through all 3 account types
- [ ] Walkthrough written

### Stretch (only if ahead of schedule)

- [ ] 12 POD upload/viewer
- [ ] 13 Compliance expiry alerts
- [ ] 14 Audit log viewer

---

## Scope Cuts Applied

_List any cuts made from the scope-cut priority list in build-plan.md, and when._

---

## Decisions Made During Build

- **DB swap (before Phase 0):** Switched from Prisma + Neon (PostgreSQL) to Mongoose + MongoDB Atlas. The embedded document model removes transaction-wrapping code: `statusHistory` and `rateConfirmations` are embedded subdocument arrays inside the `loads` document — a status change + audit entry is a single `findOneAndUpdate` with `$push`, no cross-collection session needed. The FK-safety discipline from Postgres is replicated in code: every route resolves org IDs server-side from the session; `carrierOrgId` is validated against the `orgs` collection (confirming `type: 'CARRIER'`) before being written to a load.

---

## Notes

_Workarounds, gotchas, anything that differs from the context files._
