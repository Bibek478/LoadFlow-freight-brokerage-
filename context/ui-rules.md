# UI Rules

Concise, hackathon-scoped. No sidebar, no drawer, no dark mode — one clean layout, reused everywhere.

---

## Layout

- Page max-width: 1200px, centered
- Content padding: 24px
- Gap between sections: 20px
- Top navbar only, 60px tall, white background, border-bottom

## Navbar

Renders different links by `org_type`:

- **Broker**: Dashboard, Load Board, Staff (admin only), org name on the right
- **Carrier**: Dashboard, Compliance, Staff (admin only), org name on the right
- **Shipper**: Dashboard only, no org name (individual account)

Active link: `text-accent font-medium`. Inactive: `text-text-secondary font-medium`. Color change only, no underline.

## Cards

Every content block lives in a card (see ui-tokens.md). Never put color on the card surface itself — color goes on badges/banners inside.

## Forms

```
background: bg-surface
border: 1px solid var(--border)
border-radius: 8px
padding: 8px 12px
focus: ring-1 ring-accent
```

- Role builder checkboxes: group by permission catalog, one checkbox per permission, plain list — no fancy drag-and-drop, no time for it
- Every form that mutates data shows a loading state on submit and a human-readable error if the API returns `success: false` — never show the raw error string from the API

## Load Board (Broker only)

- Columns: Company/Shipper, Route (origin → destination), Status badge, Carrier (or "Unassigned"), Compliance flag icon if flagged, Date Found
- Filter bar: text search (company/shipper/route), status dropdown filter
- Row click → `/loads/[id]`
- No pagination required for MVP unless there's time — a scrollable table is acceptable for a hackathon demo dataset

## Load Detail Page

- Status badge + compliance flag banner (if flagged) at the top, impossible to miss
- Status action buttons — only the ones the current user's permissions allow render at all (not shown-then-disabled; genuinely absent, since the API blocks it anyway and there's no reason to tease an action that will 403)
- Audit trail — reverse chronological list, "Status changed from X to Y by [name] — [time]"
- Rate confirmation panel — current version prominent, past versions collapsed/listed below with version number and date

## Dashboards

Keep these list-based, not chart-based — a bar chart is not worth the build time here. A dashboard is: a few stat numbers (counts) + a scoped list of loads relevant to that account type.

## Empty States

Every list that can be empty shows short muted text (`text-text-muted`) and, where relevant, a CTA button. No icons required — skip for time.

## Do Nots

- Never use raw Tailwind color classes or hardcoded hex
- Never show a status action button the user's permissions don't allow — check before rendering, not just before submitting
- Never show a raw API error message to the user
- Never use `position: fixed`
- Never build a custom drag-and-drop role builder — checkboxes are enough
