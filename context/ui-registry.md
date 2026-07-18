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

### Compliance Form
File: `components/compliance/ComplianceForm.tsx`, `app/compliance/page.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Container BG     | `var(--color-surface)`                 |
| Container Border | `1px solid var(--color-border)`        |
| Container Radius | `var(--radius-lg)`                     |
| Spacing          | `padding: 20`                          |
| Input Fields     | `var(--color-surface)` background, `1px solid var(--color-border)` |
| Save Button      | `var(--color-accent)` background, `var(--color-accent-foreground)` text |

**Pattern notes:**
The compliance settings page uses a responsive layout card with standard form labels and comma-separated inputs mapped to string array fields internally.

### Load Posting Form & Selection Panel
File: `components/loads/LoadForm.tsx`, `components/loads/CarrierAssignmentPanel.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Background       | `var(--color-surface)`                 |
| Border           | `1px solid var(--color-border)`        |
| Border radius    | `var(--radius-lg)` (card), `var(--radius-md)` (inputs) |
| Text — primary   | `var(--color-text-primary)`, `16px`    |
| Text — secondary | `var(--color-text-secondary)`, `13px`  |
| Spacing          | `padding: 24`, `padding: 20`           |
| Hover state      | Cursor pointer                         |

**Pattern notes:**
Standardizes form layouts inside cards using existing auth/staff spacing variables, maintaining a consistent `--radius-lg` for outer panels and `--radius-md` for interactive inner fields.

### Compliance Override Alert Banner
File: `components/loads/ComplianceOverrideBanner.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Background       | `var(--color-warning-light)`           |
| Border           | `1px solid var(--color-warning)`       |
| Border radius    | `var(--radius-lg)`                     |
| Text — primary   | `var(--color-warning)` (Heading)       |
| Text — secondary | `var(--color-text-primary)` (Desc)     |
| Spacing          | `padding: 16`                          |
| Button BG        | `var(--color-warning)`                 |
| Button Text      | `#ffffff`                              |

**Pattern notes:**
Warning states diverge from standard accent colors, explicitly introducing amber/warning token clusters to highlight non-compliant states prominently.

### Rate Confirmation Panel
File: `components/loads/RateConfirmationPanel.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Background       | `var(--color-surface-secondary)`       |
| Border           | `1px solid var(--color-border)`        |
| Border radius    | `var(--radius-md)`                     |
| Text — primary   | `24px` bold `var(--color-text-primary)`|
| Text — accent    | `var(--color-accent)`                  |
| Spacing          | `padding: 16`                          |
| Timeline Border  | `borderLeft: "2px solid var(--color-border)"` |

**Pattern notes:**
Uses a dashed bottom border or left solid border to denote itemized accessorials and historical rate timelines, keeping historical data visually subdued compared to the active rate.

### Transit Action Panel
File: `components/loads/LoadStatusActions.tsx`
Last updated: 2026-07-18

| Property         | Class (Inline Styles mapped to tokens) |
| ---------------- | -------------------------------------- |
| Background       | `var(--color-surface-secondary)`       |
| Border           | `1px solid var(--color-border)`        |
| Border radius    | `var(--radius-md)`                     |
| Text — primary   | `var(--color-text-secondary)`, `12px`  |
| Button padding   | `padding: 8px 16px`                    |

**Pattern notes:**
Status action panels group together contextual operational buttons, using specific red error classes for declines and standard accents for positive progressions.
