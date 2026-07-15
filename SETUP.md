# المکہ فیکٹری (Al-Makkah Factory) — Updated Build

 Urdu-medium marble processing management system — Next.js 16 + Prisma + Tailwind v4.

 ## What was updated in this build

 ### 1. Theme system (NEW)
 - Added `next-themes`-powered theme provider (`src/components/theme-provider.tsx`)
 - Added a 3-state theme toggle in the header (Light / Dark / System) — `src/components/theme-toggle.tsx`
 - Added a fully-designed theme picker card inside **Settings** (radio-style segmented control)
 - The legacy dark-mode switch in Settings now also drives the real theme
 - Theme is persisted in `localStorage` under key `almakkah-theme` AND in the DB (`settings.theme`)
 - An inline pre-paint script in `layout.tsx` applies the stored theme class before first paint — no flash of wrong theme

 ### 2. Color palette (NEW)
 - **Primary**: bright royal blue (`oklch(0.55 0.18 260)` ≈ `#2563eb` light, `#5295ff` dark)
 - **Accent (active state)**: vivid orange (`oklch(0.70 0.18 50)` ≈ `#f97316` light, `#fb923c` dark)
   - Used for: active nav item, active bottom-nav indicator, active theme picker, active button variant, focus rings
 - **Background**: Copilot-style canvas (`#f6f8fa` light / `#0d1117` dark)
 - Chart palette re-tinted to match (blue family + orange highlight)
 - Sidebar uses a subtle blue-tinted surface

 ### 3. Mobile-friendly polish
 - All buttons / tap targets meet 44×44px minimum on mobile
 - Input font-size forced to 16px on mobile to prevent iOS auto-zoom on focus
 - Header padding adjusted for small screens
 - Bottom-nav active tab shows a small orange indicator bar
 - Sheet drawer now uses `85vw` on mobile (was 80, sometimes cut off)
 - Sticky "Save" button has extra bottom clearance so it doesn't overlap the mobile bottom-nav
 - Theme toggle is in the header on `sm+` screens, and inside the drawer on very small screens

 ### 4. Button component
 - Added a new `active` variant (`variant="active"`) for the orange "currently selected" state
 - All variants now have a subtle `active:scale-[0.98]` press-feedback
 - `focus-visible` ring uses the orange accent so keyboard users always see where they are

 ### 5. Verified working
 - `npx tsc --noEmit` passes for the application code (only the `examples/` folder has missing-optional-dep errors, which are pre-existing and unrelated)
 - `npx eslint` passes on all modified files
 - `npx next build` succeeds — 1 static page + 30 dynamic API routes compile cleanly
 - Dev server starts and serves HTTP 200 on `/` with all Urdu text rendering correctly

 ## Setup

 ```bash
 # 1. Install deps
 npm install        # or: bun install

 # 2. Configure environment
 cp .env.example .env   # then edit .env with your real DATABASE_URL
 # Required env vars:
 #   DATABASE_URL   = postgresql://user:pass@host:5432/dbname
 #   DIRECT_URL     = postgresql://user:pass@host:5432/dbname   (for migrations)

 # 3. Push schema to your Postgres database
 npx prisma db push
 # (optional) seed reference data
 npx tsx scripts/seed.ts

 # 4. Run dev server
 npm run dev
 # → http://localhost:3000
 ```

 ## Tech stack
 - Next.js 16 (Turbopack) + React 19
 - TypeScript 5 (strict)
 - Tailwind CSS v4 (`@theme inline` based design tokens)
 - shadcn/ui (Radix primitives)
 - Prisma 6 + PostgreSQL (Supabase-compatible schema)
 - next-themes for dark/light/system theme switching
 - Recharts for charts
 - Urdu RTL layout (Noto Naskh Arabic + Noto Nastaliq Urdu fonts)

 ## Module list
 | Module | Path | Purpose |
 |---|---|---|
 | ڈیش بورڈ | `/` (dashboard) | Today's stats, recent cutting & food, alerts |
 | پتھر کی اقسام | marble-types | Marble type CRUD |
 | سائز اور موٹائی | sizes-thickness | Size + thickness CRUD |
 | کٹنگ ریکارڈ | cutting-records | Main cutting log + auto weight calc |
 | مزدور کی اقسام | labour-categories | Labour category CRUD |
 | عملہ اور عہدے | staff | Designations, staff, attendance (tabs) |
 | بلیڈ کی اقسام | blades | Blade types + blades + usage |
 | کھانے کا خرچہ | food-expenses | Food expense CRUD |
 | ذخیرہ / انوینٹری | inventory | Inventory movements |
 | رپورٹس | reports | Aggregated reports + charts |
 | ترتیبات | settings | Factory info, units, theme picker |
