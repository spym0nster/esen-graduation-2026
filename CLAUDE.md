# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page invitation + RSVP + check-in app for the ESEN Graduation Ceremony 2026. Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript. There is **no database**: a Google Sheet is the system of record, and RSVPs are confirmed by emailing QR-coded tickets that get scanned at the door.

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

`middleware.ts` runs `next-intl` only on the public marketing site. Its matcher **excludes** `api`, `ticket`, `verify`, `scanner`, `admin`, and static files. As a result there are two disjoint sets of pages with two different root layouts:

- **Localized public site** — `app/[locale]/*` (locales `en`/`fr`, default `en`; see `i18n/routing.ts`). Wrapped by `app/[locale]/layout.tsx`, which adds `NextIntlClientProvider`, `Navbar`, and `Footer`. The homepage `app/[locale]/page.tsx` composes the section components from `components/sections/*`.
- **Non-localized app pages** — `app/admin`, `app/scanner`, `app/ticket/*`, `app/verify/*`, plus all `app/api/*`. These use the bare `app/layout.tsx` and have **no** locale segment, navbar, footer, or translations.

Both `app/layout.tsx` and `app/[locale]/layout.tsx` independently declare `<html>` and load the same Google fonts — keep them in sync if you change fonts/metadata.

### Data layer (Google Sheets, two-tier)

- `lib/googleSheets.ts` — low-level sheet I/O via `googleapis` (get/append/update/delete rows). **Note:** `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` has its literal `\n` restored to real newlines here.
- `lib/rsvpService.ts` — typed CRUD over two tabs, `Students` and `Guests`. Column positions are hard-coded in the `S` and `G` index maps; **if you reorder or add columns, update those maps and the `*_HEADERS` arrays together.** Objects carry an internal `_rowIndex` (1-based sheet row) that `updateStudent`/`updateGuest` require to target the right row. Sheet headers are created lazily on first write.

Each person has **two** identifiers: a `id` (internal UUID) and a `qrId` (the UUID embedded in the QR code / verify URL). Lookups for check-in use `qrId`; admin/relations use `id`.

### RSVP → ticket flow

`POST /api/rsvp` (`app/api/rsvp/route.ts`): validate with `lib/rsvp.ts` (`validateRSVP`, also defines `VALID_CLASSES`/`VALID_SPECIALTIES`, max 2 guests) → reject duplicate email (409) → mint UUIDs for student + each guest → append rows to Sheets → render QR codes (`qrcode`) → build PDF (`lib/pdfGenerator.ts`) → email via `lib/emailService.ts` (nodemailer/SMTP) using the template in `lib/emailTemplate.ts`. Email failure is non-fatal: the RSVP still succeeds and `emailStatus` stays `Pending`/`Failed`.

### Check-in flow

`app/scanner/page.tsx` uses `html5-qrcode` to read a QR, then `POST /api/verify` (`app/api/verify/route.ts`). The endpoint accepts either a full verify URL or a raw QR id, resolves student-vs-guest, and **idempotently** marks `scanned`/`scannedAt` — re-scanning returns `already_scanned` rather than re-admitting.

### Admin

`app/admin/page.tsx` + `app/api/admin/*`. Auth is a single shared passcode: `POST /api/admin/login` sets an httpOnly `admin_auth` cookie (8h) whose value is compared directly against `ADMIN_PASSCODE` on every admin API call (`cookieStore.get("admin_auth")?.value === process.env.ADMIN_PASSCODE`). Admin routes cover attendee list/delete, stats, QR/resend, and XLSX export (`xlsx`). Deleting a student also deletes their guest rows.

### Static content & i18n

Ceremony content (committee, majors, moderators, programme, seating) lives in `data/*.ts` and is imported directly by section components. UI translation strings are in `messages/en.json` / `messages/fr.json`, loaded via `i18n/request.ts`.

## Environment variables

Required for the app to function (no `.env.example` exists):

- **Google Sheets:** `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- **SMTP email:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`
- **Admin:** `ADMIN_PASSCODE`
- **URLs:** `NEXT_PUBLIC_BASE_URL` (used to build QR/verify links; falls back to the Vercel URL)

`@vercel/kv` is installed and the app is built to deploy on Vercel.

## Conventions

- Import alias `@/*` maps to the repo root (`tsconfig.json`).
- `next.config.ts` serves images unoptimized in dev (`unoptimized: isDev`) and sets long immutable cache headers on `/images/*` and `/background.webp`; image source paths are centralized in `lib/images.ts`.
