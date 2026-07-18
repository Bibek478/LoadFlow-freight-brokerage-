<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# LoadFlow — Agent Instructions

Freight Brokerage Operations Suite. Hackathon build. **Time budget: under 24 hours, solo.**

## Read Before Anything Else

Read in this exact order before any implementation:

1. context/project-overview.md
2. context/architecture.md
3. context/ui-tokens.md
4. context/ui-rules.md
5. context/ui-registry.md
6. context/code-standards.md
7. context/library-docs.md
8. context/build-plan.md
9. context/progress-tracker.md

## The Constraint That Overrides Everything Else

This is a time-boxed solo build. If a feature is taking more than ~2x its estimated time in build-plan.md, **stop and cut it** using the scope-cut priority list at the bottom of build-plan.md — don't push through. A working, deployed app with 8 solid features beats a broken app with 12 half-built ones. Judges see the demo, not your intentions.

## Rules That Never Change

- Every mutation and every scoped read for Loads, Rate Confirmations, and Compliance Records goes through an `app/api/` route handler that calls `requirePermission()` and a `scope*()` helper from `lib/rbac.ts`. No exceptions — not even for "just this one internal call."
- Never hardcode role names in a permission check (`if (user.role === 'Dispatcher')`). Always check permission strings (`if (hasPermission(user, 'load.assign_carrier'))`).
- Every permission-denied attempt is logged via `logAccessDenied()` in `lib/rbac.ts` — this is graded, don't skip it.
- Update `progress-tracker.md` and `ui-registry.md` after every feature. This doubles as your commit trail for "AI usage kept visible" — commit after each feature with a message referencing the feature number.
- Deploy to Vercel after Phase 0 and after every phase that follows. Never let more than one phase go undeployed — a broken deploy found at hour 20 is a disaster, found at hour 6 is a 10-minute fix.
- Never use hardcoded hex values or raw Tailwind color classes — use tokens from ui-tokens.md.

## Available Skills

None installed for this project. If you add any third-party library skill mid-build, note it here and in library-docs.md.

<!-- END:nextjs-agent-rules -->
