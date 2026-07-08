# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page invitation + RSVP + check-in app for the ESEN Graduation Ceremony 2026. Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript. There is **no traditional database**: a Google Sheet is the system of record for attendees, guests, media, and an audit trail; `@vercel/blob` stores uploaded photos. RSVPs are confirmed by emailing QR-coded tickets that get scanned at the door.

## Commands

Package manager is **pnpm** (see `pnpm-workspace.yaml` / `pnpm-lock.yaml`).

```bash
pnpm dev              # dev server (Turbopack), http://localhost:3000
pnpm build            # production build
pnpm start            # serve production build
pnpm lint             # eslint (flat config in eslint.config.mjs)
pnpm optimize-images  # regenerate public/**/*.webp from source images
```

There is **no test suite**. The `*.js` files in the repo root (`check_sheets.js`, `clear_sheets.js`, `list_students.js`, `fix*.js`) are ad-hoc operational scripts for poking at the Google Sheet, not part of the app.

`pnpm optimize-images` requires `sharp`, which is **not** in `package.json` dependencies — install it ad-hoc before running. The script writes `.webp` next to each source image in `public/`.

## Architecture

### Two parallel route trees (this is the key thing to understand)

`middleware.ts` runs `next-intl` only on the public marketing site. Its matcher **excludes** `api`, `ticket`, `verify`, `scanner`, `admin`, `ceremony`, `wall`, `plan`, and static files. As a result there are two disjoint sets of pages with two different root layouts:

- **Localized public site** — `app/[locale]/*` (locales `en`/`fr`, default `en`; see `i18n/routing.ts`). Wrapped by `app/[locale]/layout.tsx`, which adds `NextIntlClientProvider`, `Navbar`, and `Footer`. The homepage `app/[locale]/page.tsx` composes the section components from `components/sections/*`.
- **Non-localized app pages** — no locale segment, navbar, footer, or translations:
  - `app/admin/*` — attendee management (`page.tsx`) plus standalone dashboards `analytics/`, `live/`, `jour-j/` (day-of countdown/stats view).
  - `app/scanner/*` — QR check-in (`page.tsx`) and `walkin/` (on-the-spot admission with no pre-registration).
  - `app/ticket/[studentId]` and `app/ticket/guest/[guestId]` — printable ticket views.
  - `app/verify/[id]` and `app/verify/guest/[guestId]` — the URLs embedded in QR codes.
  - `app/ceremony`, `app/plan` (seating chart), `app/wall` (live photo wall/gallery) — public standalone pages, no i18n.
  - All `app/api/*` routes.

Both `app/layout.tsx` and `app/[locale]/layout.tsx` independently declare `<html>` and load the same Google fonts — keep them in sync if you change fonts/metadata.

### Data layer (Google Sheets, two-tier)

- `lib/googleSheets.ts` — low-level sheet I/O via `googleapis` (get/append/update/delete rows). **Note:** `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` has its literal `\n` restored to real newlines here.
- `lib/rsvpService.ts` — typed CRUD over the `Students` and `Guests` tabs. Column positions are hard-coded in the `S` and `G` index maps; **if you reorder or add columns, update those maps and the `*_HEADERS` arrays together.** Objects carry an internal `_rowIndex` (1-based sheet row) that update/void/delete require to target the right row.
- `lib/media.ts` — CRUD over the `Media` tab (photo wall uploads: id/type/url/caption/author/createdAt). Blob deletion (`@vercel/blob`'s `del`) is best-effort.
- `lib/history.ts` — append-only audit log in the `Historique` tab (`logHistory`/`getHistory`/`diffStudent`). Never throws — a failed audit write must not break the caller (update/void/delete still succeed).

Each person has **two** identifiers: an `id` (internal UUID) and a `qrId` (the UUID embedded in the QR code / verify URL). Lookups for check-in use `qrId`; admin/relations use `id`. A student can be **voided** (`voidStudent`, `voided` flag + `getVoidedQrIds`) to cancel a ticket without deleting the audit history.

### RSVP → ticket flow

`POST /api/rsvp` (`app/api/rsvp/route.ts`): validate with `lib/rsvp.ts` (`validateRSVP`, also defines `VALID_CLASSES`/`VALID_SPECIALTIES`, max 2 guests) → reject duplicate email (409) → mint UUIDs for student + each guest → append rows to Sheets → render QR codes (`qrcode`) → build PDF (`lib/pdfGenerator.ts`) → email via `lib/emailService.ts` (nodemailer/SMTP) using the template in `lib/emailTemplate.ts`. Email failure is non-fatal: the RSVP still succeeds and `emailStatus` stays `Pending`/`Failed`.

`emailStatus` also takes the values `Walk-in` (admitted at the door via `/api/scanner/walkin`, no prior RSVP) and `VIP` (created via `/api/admin/vip` — a "special invitation" stored as a Students row with `classe = "VIP"` and `qrId === id`, so the scanner/dashboards/void/history all work without extra plumbing).

### Check-in flow

`app/scanner/page.tsx` uses `html5-qrcode` to read a QR, then `POST /api/scanner/verify` (there's also a top-level `/api/verify` — check which one a given caller uses before assuming). The endpoint resolves student-vs-guest by `qrId`, rejects voided tickets, and **idempotently** marks `scanned`/`scannedAt` — re-scanning returns `already_scanned` rather than re-admitting. Scanner routes also include `search` (manual lookup) and `walkin` (register + admit in one step).

Scanner auth is **separate from admin auth**: `lib/scannerAuth.ts` mirrors `lib/adminAuth.ts` but checks a distinct `SCANNER_PASSCODE` against a distinct `scanner_auth` cookie — an admin session does not grant scanner access and vice versa.

### Admin

`app/admin/page.tsx` + `app/api/admin/*` cover attendee list/update/delete/void, VIP creation, guest-count edits (`set-guests`), stats, QR/resend, history, and XLSX export (`xlsx`). `app/admin/analytics`, `app/admin/live`, and `app/admin/jour-j` are separate standalone dashboards (charts via `chart.js`, count-up/confetti via `components/ui/useCountUp` + `lib/celebrate.ts`) sharing the same admin auth.

Auth (`lib/adminAuth.ts`): `POST /api/admin/login` checks the passcode against `ADMIN_PASSCODE` (constant-time compare, IP rate-limited) and, on success, sets an httpOnly `admin_auth` cookie holding a signed `<expiry>.<hmac>` token (`ADMIN_SESSION_SECRET`, or `ADMIN_PASSCODE` if unset, is the HMAC key) — not the raw passcode. Every admin API route calls `isAdmin()` to verify that token. Deleting a student also deletes their guest rows.

### PDF generation

`lib/pdfGenerator.ts` builds the ticket PDF attached to RSVP emails. `app/api/plan-pdf`, `app/api/programme-pdf`, and `app/api/flyer-pdf` generate the seating plan, programme, and combined A5 flyer PDFs (jsPDF) served on demand — these back the print-friendly views at `app/plan` and the flyer routes, independent of the RSVP flow.

### Static content & i18n

Ceremony content (committee, majors, moderators, programme, seating) lives in `data/*.ts` and is imported directly by section components and by the plan/programme PDF routes. UI translation strings are in `messages/en.json` / `messages/fr.json`, loaded via `i18n/request.ts`.

## Environment variables

Required for the app to function (no `.env.example` exists):

- **Google Sheets:** `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- **SMTP email:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`
- **Admin:** `ADMIN_PASSCODE` (optionally `ADMIN_SESSION_SECRET` to sign sessions with a separate key)
- **Scanner:** `SCANNER_PASSCODE` (optionally `SCANNER_SESSION_SECRET`)
- **Blob storage (photo wall):** Vercel Blob env vars (`@vercel/blob`, used by `lib/media.ts` / `app/api/media/upload`)
- **URLs:** `NEXT_PUBLIC_BASE_URL` (used to build QR/verify links; falls back to the Vercel URL)

The app is built to deploy on Vercel.

## Conventions

- Import alias `@/*` maps to the repo root (`tsconfig.json`).
- `next.config.ts` serves images unoptimized in dev (`unoptimized: isDev`) and sets long immutable cache headers on `/images/*` and `/background.webp`; image source paths are centralized in `lib/images.ts`.
