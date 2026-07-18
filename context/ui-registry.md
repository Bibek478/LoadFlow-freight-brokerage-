# UI Registry

Living document. Update after every component is built. Check here before building a new component — match existing patterns exactly before inventing new ones.

---

## How to Use

1. Before building any component, check if a similar one already exists here.
2. If yes — match its exact classes.
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here.

---

## Components

### Auth Containers
File: `components/auth/SignupForm.tsx`, `app/login/page.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Background       | `var(--color-surface)`                 |
| Border           | `1px solid var(--color-border)`        |
| Border radius    | `var(--radius-lg)`                     |
| Text — primary   | `var(--color-text-primary)`            |
| Text — secondary | `var(--color-text-secondary)`          |
| Spacing          | `padding: 32` (Container)              |
| Max Width        | `maxWidth: 420` (Centered container)   |

**Pattern notes:**
Auth containers use a centered flex layout (`minHeight: "calc(100vh - 60px)"`) with a clean `radius-lg` card on a `--color-background` page body.

### Forms & Inputs
File: `components/auth/SignupForm.tsx`, `components/staff/StaffForm.tsx`, `components/staff/RoleBuilder.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Background       | `var(--color-surface)`                 |
| Border           | `1px solid var(--color-border)`        |
| Border radius    | `var(--radius-md)`                     |
| Text — input     | `var(--color-text-primary)`, `14px`    |
| Text — label     | `var(--color-text-secondary)`, `13px`  |
| Text — error     | `var(--color-error)`, `13px`           |
| Error Background | `var(--color-error-light)`             |
| Error Border     | `1px solid var(--color-error)`         |
| Spacing          | `padding: "8px 12px"`                  |

**Pattern notes:**
Inputs use `radius-md` while panels/containers use `radius-lg`. Error messages use an explicit `--color-error-light` background and border. All labels are `13px` font weight `500`.

### Buttons
File: `components/auth/SignupForm.tsx`, `components/staff/StaffForm.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Background       | `var(--color-accent)`                  |
| Text color       | `var(--color-accent-foreground)`       |
| Disabled state   | `var(--color-accent-light)`, opacity `0.7` |
| Radius           | `var(--radius-md)`                     |
| Font weight      | `500`                                  |

**Pattern notes:**
Primary buttons use `--color-accent` background with hover state delegated to native cursor pointer and opacity changes if disabled.

### Layout Panels & Tabs
File: `components/staff/StaffPageClient.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Container BG     | `var(--color-surface)`                 |
| Container Border | `1px solid var(--color-border)`        |
| Container Radius | `var(--radius-lg)`                     |
| Spacing          | `padding: 20`                          |
| Active Tab       | `var(--color-accent)` text + border    |
| Inactive Tab     | `var(--color-text-secondary)`          |

**Pattern notes:**
Panels use `flex: 2` (lists) or `flex: 1` (editors) in a `flex-wrap` container with `gap: 24`. Items inside lists use `--color-surface-secondary` with `radius-md`.

### Badges & Tags
File: `components/staff/StaffList.tsx`, `components/staff/StaffPageClient.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Background       | `var(--color-accent-light)`            |
| Text color       | `var(--color-accent)`                  |
| Radius           | `var(--radius-full)`                   |
| Font size        | `11px` - `12px`                        |

**Pattern notes:**
Badges use full-rounded pill shapes (`radius-full`) with light accent backgrounds and solid accent text to denote roles and permissions.
