# Progress Tracker

Update this file after every completed feature. Any AI agent (or you, at hour 20) reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Stretch (Feature 13 Completed)
**Last completed:** 13 Compliance expiry alerts
**Next:** Production Verification / Other Stretch Features
**Hours elapsed:** 15.50
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

- [x] 09 Broker dashboard + load board search/filter
- [x] 10 Carrier dashboard
- [x] 11 Shipper dashboard

### Phase 5 — Client-Side Navigation Performance Optimization

- [x] 15 Navigation triggers refactor (Next.js Link)
- [x] 16 Custom loading.tsx skeletons (Streaming UI)
- [x] 17 Sc scoping and sort DB indexing

### Stretch (only if ahead of schedule)

- [x] 12 POD upload/viewer
- [x] 13 Compliance expiry alerts
- [ ] 14 Audit log viewer

---

## Scope Cuts Applied

_List any cuts made from the scope-cut priority list in build-plan.md, and when._

---

## Decisions Made During Build

- **DB swap (before Phase 0):** Switched from Prisma + Neon (PostgreSQL) to Mongoose + MongoDB Atlas. The embedded document model removes transaction-wrapping code: `statusHistory` and `rateConfirmations` are embedded subdocument arrays inside the `loads` document — a status change + audit entry is a single `findOneAndUpdate` with `$push`, no cross-collection session needed. The FK-safety discipline from Postgres is replicated in code: every route resolves org IDs server-side from the session; `carrierOrgId` is validated against the `orgs` collection (confirming `type: 'CARRIER'`) before being written to a load.
- **Client-Side Navigation Performance Hotfix (Phase 5):** Formally opted to resolve route transition freezes by moving from imperative raw cursor table-row routes to prefetchable `<Link>` tags embedded within cells (maintaining hover states) and introducing local streaming layout elements (`loading.tsx`) for the dashboard and loads route sections. Added compound indexing targets on all scoping fields in MongoDB (`brokerOrgId`, `carrierOrgId`, `shipperId`) combined with matching sorting criteria (`createdAt: -1`) to avoid database fetch blocks.
- **POD base64 MongoDB storage (Stretch - Feature 12):** Chose to store the carrier-uploaded Proof of Delivery (POD) documents (PDF / images) directly in the `loads` document inside MongoDB as a base64 Data URL in the `podUrl` string field, bypassing the need for Vercel Blob or external file storage, keeping it responsive and self-contained.
- **Compliance expiry alerts API & alerts UI (Stretch - Feature 13):** Designed a unified `/api/compliance/alerts` API route to dynamically check and generate insurance expiry alerts based on the session user's role (Carrier checks own, Broker checks carriers of active loads). Rendered customized top-level warning banners on both the Carrier Dashboard and Broker Load Board.

---

## Notes

_Workarounds, gotchas, anything that differs from the context files._
