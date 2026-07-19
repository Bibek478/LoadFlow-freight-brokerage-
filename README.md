# LoadFlow

A secure, compliance-first operations suite for freight brokerage that connects shippers and carriers, featuring admin-built dynamic RBAC and API-level security gates.

---

## Agentic Development System: Context & Skills

This project was developed using a rigorous **Agentic Context and Skills System** that ensures strict architectural conformance, strict token efficiency, and predictable database styling rules. 

### 1. Developer Context Catalog (`context/`)
The `context/` directory serves as the centralized, immutable source of truth for the codebase. Every rule, schema, and page outline was systematically referenced during each development turn:

* **`project-overview.md`**: Outlines the core product scenario, user classes (Broker, Carrier, Shipper), and constraints. It lists the **7 fixed permissions** that cannot be added to or modified dynamically at runtime.
* **`architecture.md`**: Specifies stack choices, API boundaries, security gates, and detail views. It maps out Mongoose collections (`orgs`, `users`, `roles`, `loads`, `carrier_compliance_records`, `access_denied_logs`) and the central Load state machine transitions.
* **`ui-tokens.md`**: Establishes strict semantic tokens for layouts (surfaces, text priorities, states, borders) and details the uniform background and text colors mapping to status badges.
* **`ui-rules.md`**: Establishes visual standards (max widths, margins, navbar item toggles by org type, custom dashboard limits) and details standard "Do Nots" (e.g., prohibition of raw hex/Tailwind color utilities).
* **`ui-registry.md`**: A living catalog that details classes, containers, buttons, and layouts for every component built, ensuring complete styling consistency across pages.
* **`code-standards.md`**: Defines Next.js API route structures (using try/catch envelopes and `requirePermission`), file naming conventions, package constraints, and exception policies.
* **`library-docs.md`**: Documents transactional Mongoose methods, connection singletons, and custom `jose`/`bcryptjs` session state functions.
* **`build-plan.md`**: Outlines step-by-step feature rollout instructions, estimated time boundaries, and scope contraction guidelines.
* **`progress-tracker.md`**: Tracks completion status, stretch details, and architectural decisions made over the course of implementation.

### 2. Autonomous Agent Skills (`.agents/skills/`)
The development agent leveraged specialized skills located in the workspace to optimize communication structure, lint correctness, and memory retention:

* **`caveman`**: An ultra-compressed technical dialogue skill. It compresses developer replies by stripping filler words and articles while preserving technical syntax, preserving conversation tokens.
* **`architect`**: Governs spatial database models, structural separation, and API validation checks, ensuring business logic exists solely outside of pages and routes.
* **`imprint`**: Enforces record keeping of file alterations and saves trace steps for regression detection.
* **`remember`**: Retains session history parameters, prior phase decisions, and environment configurations across multiple conversation turns.
* **`recover`**: Provides guidelines for identifying runtime bugs, rolling back malformed configurations, and recovering database connectivity safely.
* **`review`**: Executes automated verification scripts, syntax checks, ESLint rules, and route validation tests prior to committing code.

---

## Quick Start for Judges

### 1. Live Deployed Suite
* Deployed URL: https://load-flow-freight-brokerage.vercel.app

### 2. Seeded Demo Accounts
> **Note on Seed Data:** There is no database seed script or pre-seeded accounts in the codebase. To see the multi-tenant scoping and role-based access control (RBAC) boundaries in action, you must sign up for new accounts directly via the application UI:
* **Broker Org Admin**: Sign up at `/signup/broker` (e.g., `broker.admin@company.com`).
* **Carrier Org Admin**: Sign up at `/signup/carrier` (e.g., `carrier.admin@company.com`).
* **Shipper**: Sign up at `/signup/shipper` (e.g., `shipper.individual@company.com`).
* **Restricted Staff**: Log in as a Broker/Carrier Admin, navigate to **Staff & Roles** (`/staff`), create a customized role (e.g., *Dispatcher* with `load.create` but WITHOUT `staff.manage`), and create a new staff account. You can then log in with that staff account to verify that restricted actions are inaccessible.

### 3. Local Installation & Run
To run LoadFlow locally, perform the following steps:

1. **Clone the Repository** and navigate to the root directory.
2. **Configure Environment Variables**: Create a `.env` file in the root directory (based on the active configurations) with the following parameters:
   ```env
   # MongoDB Atlas Connection String
   MONGODB_URI=mongodb+srv://...
   
   # Cryptographic key for JWT signatures
   JWT_SECRET=your_jwt_secret_key
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
5. **Open in Browser**: Navigate to `http://localhost:3000`.

---

## Tech Stack

| Layer | Tool | Purpose | Why |
|---|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack application directory | High performance server-rendering, unified pages and API endpoints. |
| **Language** | TypeScript | Type safety across codebase | Enforces compile-time checks on states, permissions, and session payloads. |
| **Database** | MongoDB | Document database | Embedded structure allows status transition history and rate confirmations to reside inside a single Load document. |
| **ODM / DB Client** | Mongoose | Schema definition & validations | Simplifies querying, index definitions, and embedded subdocument schemas without database migrations. |
| **Authentication** | Custom JWT + cookies (`jose`, `bcryptjs`) | Stateless user sessions | Stores user parameters (org type, org ID, admin flag, permissions array) inside a secure `httpOnly` cookie. |
| **Styling** | Tailwind CSS + CSS Variables | User interface styling | Lean styling using high-contrast corporate colors and consistent design tokens. |
| **Icons** | Lucide React | Visual design indicators | Standard vector graphics representation. |

---

## Role-Based Access Control (RBAC)

LoadFlow implements a strict, runtime-definable RBAC engine that prevents unauthorized access directly at the API route layer.

* **Fixed Permission Catalog**: The system operates on a fixed list of 7 permission keys:
  * `load.create` (Broker only)
  * `load.assign_carrier` (Broker only)
  * `load.override_compliance_flag` (Broker only)
  * `rate.confirm` (Broker only)
  * `load.update_status` (Carrier only)
  * `staff.manage` (Broker/Carrier Admins)
  * `pod.upload` (Carrier only)
* **Custom Roles**: Organization administrators build custom roles (e.g. *Dispatcher*, *Driver*) by selecting permission bundles from the catalog.
* **Permission Gating (Never Role Gating)**: Security checks verify the permission string representation (e.g., `hasPermission(user, 'load.assign_carrier')`) rather than role name strings.
* **API Enforcement**: Gating is enforced on every single mutation and read handler inside the `app/api/` folder using the `requirePermission()` helper in `lib/rbac.ts`. Security overrides and unauthorized requests are logged in the `AccessDeniedLog` database collection.
* **Organization Scoping**: Users are locked to their own organization scope by filtering queries through the `scope*()` helpers in `lib/rbac.ts` on every read and write.
* **Object-Level Scoping**: Users can only view or interact with Loads where their organization ID matches the `brokerOrgId`, `carrierOrgId`, or `shipperId` in the document.

---

## Data Model

The application uses these 6 primary models (located in `lib/models/`):

1. **Org**: Represents a tenant organization of type `BROKER` or `CARRIER`.
2. **User**: Represents individuals (including Admins, Staff, and individual Shippers) holding credentials and reference connections to an Org and a Role.
3. **Role**: Represents a bundle of customized permission string keys scoped to a single Org.
4. **CarrierComplianceRecord**: Represents state parameters (insurance expiry date, regulatory MC/DOT status, and approved equipment/commodity scopes) for a Carrier organization.
5. **Load**: The central transaction document representing a shipment.
   * *Status Transition History* (`statusHistory`) and *Rate confirmations* (`rateConfirmations`) are nested directly as embedded subdocument arrays to keep lifecycle records atomic and highly queryable.
6. **AccessDeniedLog**: Tracks disallowed operational requests, capturing user ID, attempted permission, and route parameters.

### Load State Machine States
Loads transition through the following states in order:
1. `POSTED`: Created by broker staff.
2. `CARRIER_ASSIGNED`: A carrier org is assigned; runs compliance rules matching equipment/commodities and insurance dates. Carrier can decline to transition the load back to `POSTED`.
3. `RATE_CONFIRMED`: Broker confirms rate confirmation version. Progression is blocked if the carrier is non-compliant, unless overridden by a user holding `load.override_compliance_flag`.
4. `DISPATCHED`: Assigned carrier dispatches driver/resources.
5. `IN_TRANSIT`: Cargo picked up and moving.
6. `DELIVERED`: Cargo arrived at target destination.
7. `POD_VERIFIED` *(Stretch)*: Proof of Delivery document uploaded to the load.
8. `INVOICED_CLOSED`: Load finalized and closed.

---

## Features

### Core Features 
* **Phase 1: Auth & RBAC Core**: Multi-tenant signups (`/signup/broker`, `/signup/carrier`, `/signup/shipper`), JWT logins, API-level gating, and `/staff` role construction panel.
* **Phase 2: Compliance & Rates**: `/compliance` status management panel for carriers, and rate confirmation version tracker.
* **Phase 3: Load Lifecycle**: In-memory state machine logic, compliance validation triggers (blocking non-compliant status flow), override mechanisms, and `/loads/[id]` operational routing UI.
* **Phase 4: Dashboards & Search**:
  * **Broker**: Load search filter boards, total/flagged count widgets, and a post-load form.
  * **Carrier**: Dashboard listing assigned loads with inline status action shortcuts.
  * **Shipper**: Simple tracking view of owned shipments.
* **Phase 5: Performance Optimizations**: Prefetching Next.js `<Link>` lists, streaming skeletons (`loading.tsx`), and compound MongoDB indexing on scoping keys (`brokerOrgId`, `carrierOrgId`, `shipperId`) with `createdAt: -1`.

### Stretch Features
* **POD Upload / Viewer**: Carriers upload delivery files directly encoded as base64 strings and stored in MongoDB under `podUrl`, rendering views based on MIME-type.
* **Compliance Expiry Alerts**: Top-level warning alerts on Carrier and Broker dashboards driven by `GET /api/compliance/alerts` for insurance policies expiring within 30 days.
* **Sidebar Audit Log Timeline**: Detailed chronological history sidebar showing status updates, usernames, timestamps, and compliance override notes.

---

## Known Limitations & Design Decisions

* **Session-Baked Permissions**: Permissions are resolved at login and stored directly inside the user's JWT cookie. A role revision will not affect an active user session until they sign out and sign back in.
* **Base64 Storage for POD Files**: To limit external SaaS dependencies and build duration, documents up to 10MB are stored directly in MongoDB as base64 Data URLs, avoiding external Vercel Blob setups.
* **Plaintext Password Display on Creation**: There is no email invite infrastructure. Admins create staff and are shown a one-time temporary password to distribute manually.
* **Immutable Rate Confirmation History**: To preserve strict financial audits, confirmations are never updated or deleted. Modifying a rate pushes a newer version into the embedded `rateConfirmations` array, marking old versions historical.

---

## File & Folder Structure

```
/
├── AGENTS.md               # Solo developer agent rules & workflow constraints
├── CLAUDE.md               # Quick instructions command
├── components.json         # shadcn component layout configurations
├── eslint.config.mjs       # Lint checker parameters
├── next-env.d.ts           # Next.js environment types definitions
├── next.config.ts          # Page routing and compiler configurations
├── package.json            # Node project dependency registrations
├── postcss.config.mjs      # PostCSS styles runner
├── tsconfig.json           # TS compile restrictions
├── app/                    # Next.js pages and API route handlers
│   ├── compliance/         # Carrier compliance management route
│   ├── dashboard/          # Dynamic dashboard view router
│   ├── layout.tsx          # Shell layout components (Navbar insertion)
│   ├── login/              # Sign-in portal page
│   ├── signup/             # Organization signups routing (broker, carrier, shipper)
│   ├── staff/              # Staff invitation and role maker panel
│   ├── loads/              # Broker board search and detail views
│   └── api/                # Core REST API endpoint routes
│       ├── auth/           # Login, logout, signup routes
│       ├── compliance/     # Record and alert checks endpoints
│       ├── loads/          # CRUD and lifecycle operations routes
│       ├── rate-confirmations/ # Rate verification uploads
│       └── roles/          # Custom security permission mappings
├── components/             # Semantic modular interface components
│   ├── auth/               # Sign-in & user registration forms
│   ├── compliance/         # Regulatory update templates
│   ├── dashboard/          # Broker, carrier, shipper view structures
│   ├── layout/             # Top navbar navigation component
│   ├── loads/              # Workflow actions, uploaders, and rate sheets
│   ├── staff/              # Team lists and role management components
│   └── ui/                 # Basic UI primitives
├── context/                # Project spec sheets & requirements trackers
├── lib/                    # Core database and helper functions
│   ├── auth.ts             # JWT cryptography and encryption keys
│   ├── db.ts               # Database connection singleton
│   ├── rbac.ts             # Auth checkers and isolation scoping
│   ├── state-machine.ts    # Lifecycle validation mapping
│   ├── utils.ts            # Component styling helpers
│   └── models/             # Mongoose schemas (collection entities)
├── public/                 # Static graphical assets
└── types/                  # Central TypeScript interface exports
```

---

## AI-Assisted Development

This repository was developed using the Antigravity AI coding agent. The Git commit history represents sequential, feature-by-feature iteration, keeping tool utilization visible. Features were built systematically following the progressive Phases of the project build plan, verifying compliance and access logic programmatically prior to wrapping them in React components. A comprehensive breakdown of the context documents and workspace agent skills employed during this build is detailed in the [Agentic Development System: Context & Skills](#agentic-development-system-context-skills) section near the top of this documentation.


