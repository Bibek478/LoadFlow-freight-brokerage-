# UI Tokens

Minimal, deliberately lean token set — this is a 24h build, not a design system exercise. Enough to look consistent, not enough to spend hours on.

---

## How to Use

Tailwind CSS v4, tokens via `@theme` in `app/globals.css`. No `tailwind.config.ts`.

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", sans-serif;

  /* Surfaces */
  --color-background: #f5f6f8;
  --color-surface: #ffffff;
  --color-surface-secondary: #f8f9fb;

  /* Borders */
  --color-border: #e2e5ea;

  /* Text */
  --color-text-primary: #101828;
  --color-text-secondary: #5b6472;
  --color-text-muted: #98a1ac;

  /* Accent — freight/logistics blue */
  --color-accent: #2563eb;
  --color-accent-foreground: #ffffff;
  --color-accent-light: #eaf1ff;

  /* Semantic */
  --color-success: #16a34a;
  --color-success-light: #ecfdf3;
  --color-warning: #d97706;
  --color-warning-light: #fef6e7;
  --color-error: #dc2626;
  --color-error-light: #fef2f2;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

Never hardcode hex values or use raw Tailwind color classes (`bg-blue-500`) in components — use these tokens only.

---

## Typography

| Element | Size | Weight | Color token |
|---|---|---|---|
| Page heading | 20px | 600 | `text-text-primary` |
| Card heading | 16px | 600 | `text-text-primary` |
| Body text | 14px | 500 | `text-text-primary` |
| Secondary/label | 13px | 500 | `text-text-secondary` |
| Muted/timestamp | 12px | 400 | `text-text-muted` |

Font: Inter, via `next/font/google`.

---

## Load Status Badge Colors

One badge component, color driven entirely by status — never hardcoded per usage.

| Status | Background | Text |
|---|---|---|
| Posted | `surface-secondary` | `text-secondary` |
| Carrier Assigned | `accent-light` | `accent` |
| Rate Confirmed | `accent-light` | `accent` |
| Dispatched | `warning-light` | `warning` |
| In Transit | `warning-light` | `warning` |
| Delivered | `success-light` | `success` |
| POD Verified | `success-light` | `success` |
| Invoiced/Closed | `surface-secondary` | `text-muted` |

## Compliance Flag Banner

```
background: var(--color-error-light)
border: 1px solid var(--color-error)
text: var(--color-error)
border-radius: var(--radius-md)
padding: 12px 16px
```

Always shows the specific reason text, never just "flagged."

---

## Components

### Card
```
background: bg-surface
border: 1px solid var(--border)
border-radius: 12px
padding: 20px
```

### Buttons
Primary: `bg-accent text-accent-foreground rounded-md px-4 py-2 font-medium`
Secondary: `bg-surface border border-border text-text-primary rounded-md px-4 py-2`
Destructive (decline/override actions): `bg-error text-white rounded-md px-4 py-2`

### Badge
`rounded-full px-2.5 py-0.5 text-xs font-medium`

### Table (Load Board)
- White rows, 1px `border-border` divider, no zebra striping
- Header: uppercase, 12px, `text-text-secondary`
- Row hover: `bg-surface-secondary`

---

## Invariants

- No hardcoded hex, no raw Tailwind color classes
- One badge component for load status, colors from the table above only
- Compliance flag banner always uses the error token, never a custom color
- Font is always Inter
