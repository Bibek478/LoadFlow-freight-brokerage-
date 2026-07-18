# Code Standards

Rules for the entire build. Follow without exception — this is what keeps a 24-hour solo AI-assisted build from drifting into inconsistent patterns.

---

## Engineering Mindset

- Read context files first — never assume, verify against architecture.md
- Scope is sacred — build only what the current build-plan feature requires
- RBAC and the state machine are the load-bearing walls of this project — never take a shortcut there to save time. Take shortcuts on UI polish instead.
- Every feature must be immediately testable (via UI or `curl`) before moving to the next
- If a bug repeats after one corrective prompt, stop and re-read architecture.md before trying again — don't keep guessing

---

## TypeScript

- Strict mode, no exceptions
- Never use `any` — use `unknown` and narrow
- Explicit types on all function params and returns
- `const` by default

## Next.js Conventions

- App Router only, React 19
- Server Components by default; `"use client"` only for useState/useEffect/event handlers/browser APIs
- All data mutation and all scoped data reads go through `app/api/` route handlers — **not** Server Actions. This project needs mutations to be directly hittable as REST-style endpoints so RBAC enforcement is independently testable (`curl` a restricted endpoint, confirm 403) — that's a graded requirement, not a style preference.
- Route handlers contain no business logic beyond calling `lib/rbac.ts`, `lib/state-machine.ts`, and Mongoose models — logic lives in `lib/`, not in `route.ts`.
- Route handlers that write a Load status change call `findOneAndUpdate` with `$push statusHistory` — the audit entry and the status write are one atomic document operation, no session needed. Cross-collection atomicity (e.g. creating a User + Org together on signup) uses a MongoDB session: `const session = await mongoose.startSession(); await session.withTransaction(async () => { ... })`.

## File and Folder Naming

- Folders: kebab-case
- Component files: PascalCase
- lib/ files: camelCase
- API route files: always `route.ts`

## API Route Handler Pattern

```typescript
// app/api/loads/[id]/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    await requirePermission(user, "load.assign_carrier", `/api/loads/${params.id}/assign`);

    const { carrierOrgId } = await req.json();
    // ... compliance check, write, audit row, all in one db.$transaction

    return NextResponse.json({ success: true, data: updatedLoad });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    console.error("[loads/assign]", error);
    return NextResponse.json({ success: false, error: humanReadable(error) }, { status });
  }
}
```

- Every handler has try/catch
- Every handler returns `{ success: boolean, data?: T, error?: string }`
- 403s from `requirePermission` propagate as a typed `ApiError` — caught once, mapped to the right status
- Errors logged with route path prefix: `[loads/assign]`

## RBAC Usage

```typescript
import { getSessionUser } from "@/lib/auth";
import { requirePermission, scopeLoadsWhere } from "@/lib/rbac";

const user = await getSessionUser(req);
await requirePermission(user, "load.create", "/api/loads");
const loads = await db.load.findMany({ where: scopeLoadsWhere(user) });
```

- Never skip `requirePermission` because "the UI already hides this button" — the UI hiding a button is not enforcement
- Never skip `scopeLoadsWhere` (or the compliance/staff equivalents) on a read, even one that "should" already be safe

## State Machine Usage

```typescript
import { canTransition } from "@/lib/state-machine";

if (!canTransition(load.status, targetStatus)) {
  return NextResponse.json({ success: false, error: "Invalid status change" }, { status: 400 });
}
```

Never write `load.status = X` directly without going through `canTransition` first, and never write a status change without inserting the matching `LoadStatusHistory` row in the same transaction.

## Error Handling

- No empty catch blocks
- User-facing errors are human-readable, never the raw error/stack
- 500s return a generic message, log the real one server-side

## Environment Variables

| Variable | Used in |
|---|---|
| `MONGODB_URI` | lib/db.ts (MongoDB Atlas connection string) |
| `JWT_SECRET` | lib/auth.ts |
| `BLOB_READ_WRITE_TOKEN` | POD upload (stretch) |

Never hardcode any of these anywhere in the codebase.

## Import Aliases

Always `@/` — never relative imports going up more than one level.

## Comments

- No comments explaining *what* the code does — code should read clearly on its own
- Comments only for *why*, especially around the compliance-flag logic and the state machine, where the "why" isn't obvious from the code alone
- No TODOs left in committed code — if it's not done, it's not committed, it's in progress-tracker.md's Notes section instead

## Dependencies

Approved for this project — don't add anything not on this list without a clear reason and updating this file first:

- `next`, `react`, `react-dom`
- `mongoose`
- `bcryptjs`, `jose`
- `@vercel/blob` (stretch, POD only)
- `zod` — request body validation
- `tailwindcss`, `shadcn/ui` components
- `lucide-react` — icons

No OpenAI/AI SDK, no Browserbase, no analytics library — none of that is in scope for this project.
