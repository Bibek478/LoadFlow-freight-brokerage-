# Project Overview

## About the Project

LoadFlow is an operations platform for a freight brokerage connecting shippers and carriers. A broker posts loads, assigns them to carriers, confirms rates, and tracks each shipment from pickup to delivery — with compliance checks blocking dispatch to any carrier with lapsed insurance or authority, since the broker is legally liable for that.

Three account types, each with a different view of the same underlying loads:

- **Broker (org)** — Admin manages staff and custom roles. Staff post loads, assign carriers, confirm rates, track shipments per their permissions.
- **Carrier (org)** — Admin manages staff and custom roles. Staff accept/decline loads, update status, upload POD, per their permissions.
- **Shipper (individual)** — no sub-roles, no staff. Views only their own load status and delivery confirmation.

The hard part of this project is not the CRUD — it's that permissions are **admin-defined at runtime**, not hardcoded, and enforcement happens at the API layer, not just hidden in the UI.

---

## Permission Catalog (fixed — never add or rename without updating this file first)

```
load.create
load.assign_carrier
load.override_compliance_flag
rate.confirm
load.update_status
staff.manage
pod.upload
```

Roles are bundles of these permissions. Code checks permissions (`hasPermission(user, 'load.assign_carrier')`), **never** role names.

### Which permissions are assignable per org type

| Permission | Broker | Carrier |
|---|---|---|
| `load.create` | ✅ | — |
| `load.assign_carrier` | ✅ | — |
| `load.override_compliance_flag` | ✅ | — |
| `rate.confirm` | ✅ | — |
| `load.update_status` | — | ✅ |
| `pod.upload` | — | ✅ |
| `staff.manage` | ✅ | ✅ |

`load.update_status` covers every status transition a carrier can trigger — including accepting an assignment (Carrier Assigned → Rate Confirmed is broker-side via `rate.confirm`, but declining an assignment or moving Dispatched → In Transit → Delivered is carrier-side via `load.update_status`). A "Driver" role and a "Carrier Dispatch" role both hold `load.update_status`; the difference is that Driver also holds `pod.upload`. See build-plan.md Phase 1 for the exact example roles to seed.

Shippers have no roles and no permissions — they only ever read their own loads, enforced by object-level scoping, not the permission system.

---

## Pages

```
/                          → Marketing/landing (redirect to /login or /dashboard if signed in)
/login                     → Login (all 3 account types, one form)
/signup/broker             → Broker org signup (creates org + admin user)
/signup/carrier            → Carrier org signup (creates org + admin user)
/signup/shipper            → Shipper signup (individual account, no org)
/dashboard                 → Role-specific dashboard (broker load board / carrier assigned loads / shipper own loads)
/loads/[id]                → Load details — status actions, rate confirmation, compliance flag, audit trail
/staff                     → Staff & role management (Admin only, broker or carrier)
/compliance                → Carrier compliance record management (Carrier org only)
```

Broker and Carrier share a lot of layout (top navbar with org name); Shipper gets a stripped-down navbar with no staff/compliance links.

---

## Core User Flows

### Bootstrap (first account per org)

- `/signup/broker` and `/signup/carrier` create the **Org** and the first **User** in one transaction, with `is_org_admin = true`. This user has no `role_id` — admin status is a flag, not a role, and implicitly grants every permission valid for that org type plus `staff.manage`.
- `/signup/shipper` creates a User with `org_type = SHIPPER`, `org_id = null`, no admin flag, no role.
- There is no "invite by email" infra for this build (no time for email sending). Admins create staff directly on `/staff`: they enter name, email, temp password, and pick a role — the account exists immediately, the temp password is shown once on screen.

### Admin defines a custom role

1. Admin goes to `/staff` → "Roles" tab.
2. Sees the permission catalog filtered to their org type (see table above).
3. Names a role, checks the permissions it should bundle, saves.
4. Role is now assignable to any staff member in that org.

### Broker posts and moves a load

1. Broker staff with `load.create` posts a load (origin, destination, commodity, equipment, dates) — status `Posted`, tied to a shipper.
2. Staff with `load.assign_carrier` assigns a carrier org. System pulls that carrier's compliance record and auto-flags the load if insurance is expired, authority isn't active, or equipment/commodity isn't approved.
3. If not flagged (or flag is overridden by someone with `load.override_compliance_flag`), staff with `rate.confirm` confirms a rate — this creates Rate Confirmation v1. Status → `Rate Confirmed`.
4. Carrier staff with `load.update_status` moves it through `Dispatched → In Transit → Delivered`.
5. Carrier staff with `pod.upload` uploads proof of delivery → status `POD Verified` (stretch feature).
6. Broker staff with `load.update_status` closes it → `Invoiced/Closed`.

Every status change is timestamped and attributed to the user who made it — this is the audit trail.

### Shipper flow

Shipper logs in, sees only loads where `shipper_id = their user id`, sees current status and, once available, delivery confirmation. No actions available besides viewing.

---

## Features In Scope (must-have, per brief)

1. Auth for 3 account types; Admins create staff + custom roles; RBAC enforced server-side; org + object-level scoping
2. Load CRUD, full state machine, audit trail
3. Carrier compliance record CRUD
4. Rate confirmation with versioning
5. Compliance auto-flagging that blocks progression past "Carrier Assigned"
6. Dashboards per account type
7. Search/filter on the broker load board

## Stretch (only after all must-haves are done and deployed)

8. POD upload/viewer
9. Compliance expiry renewal alerts
10. Audit log viewer (standalone page, not just per-load history)

## Explicitly Out of Scope

- Email invites / email sending of any kind
- Payment/invoicing beyond a status label
- Real-time notifications
- Mobile app
- Multi-carrier bidding on a single load
- Editing/deleting rate confirmations after the fact (new version only — old versions are immutable)
- Backward status transitions except the single "carrier declines assignment" edge (see architecture.md)

---

## Success Criteria

- A Broker Admin can sign up, create a "Dispatcher" role, create a staff member with that role, and that staff member can post a load and assign a carrier — but cannot manage staff.
- A Carrier with expired insurance cannot be progressed past "Carrier Assigned" without an explicit override, and that override is visible in the audit trail.
- Hitting a restricted API route directly (e.g. `curl` with a Carrier staff token trying `load.assign_carrier`) returns 403 and produces a logged denial.
- A Shipper never sees another shipper's load, and Carrier staff never see loads for a different carrier org, regardless of what permissions they hold.
- Rate Confirmation history is visible — an old load shows the version that was actually confirmed at the time, not the current one.
- App is deployed and reachable at a public URL, not just running locally.
