# Senator Yunus Abiodun Akintunde, PhD — website + CMS

Public campaign site and `/admin` content management for Akintunde 2027.
Built with TanStack Start (React, server-rendered), Tailwind CSS and Supabase.

| Part                                    | Where it runs                           |
| --------------------------------------- | --------------------------------------- |
| Website + admin (this repo)             | **Vercel** (any Node host works)        |
| Database, staff logins, uploaded photos | **Lovable Cloud** (Supabase), unchanged |
| Built-in site images                    | `public/site-images/` (in this repo)    |

The app only uses the **publishable** Supabase key (in `.env`). Everything sensitive is
protected by row-level security and admin-checked database functions, so no secret
server key is needed anywhere.

---

## Run it on your computer

```bash
npm install          # or: bun install
npm run dev          # http://localhost:8080
```

## One-time: bring the images over from Lovable

```bash
node scripts/fetch-site-images.mjs
```

Downloads the ~20 built-in images (portraits, logos, project photos) into
`public/site-images/`. Commit that folder. It's already done if the folder has 20 files.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repo. Leave the settings as they are
   (`vercel.json` sets the build). Click **Deploy**.
3. Optional (recommended): in Vercel → Project → Settings → Environment Variables add
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (same values as `.env`) and, if you
   use one, `SIGNUP_WEBHOOK_URL`.
4. Domains: Vercel → Project → Settings → Domains → add `yunusakintunde.com`, then create
   the DNS records Vercel shows (at your domain/cPanel DNS zone).

Other hosts: `NITRO_PRESET=node-server npm run build` then `node .output/server/index.mjs`.

## Database changes (still on Lovable Cloud)

SQL migrations live in `supabase/migrations/`. Lovable Cloud has no direct SQL access, so
apply new ones from the Lovable project chat:
_“Apply the SQL migration supabase/migrations/<file>.sql to the Cloud database exactly as written.”_

Lovable Cloud **auth settings** to check once (Lovable → Cloud → Users → Auth settings):

- Sign-ups: **enabled** (invited staff create their own account; anyone else gets no access).
- Site URL / redirect URLs: add `https://yunusakintunde.com/**` (and your `*.vercel.app` URL)
  so confirmation and password-reset emails link back to the right site.

## Admin (`/admin`)

- **Staff:** admins invite people under **Team**; the person clicks “Invited? Create your
  account”, confirms their email, and gets access. Forgotten passwords: “Forgot password?”
  on the sign-in page, or the key icon on the Team page.
- **Sign-ups → Email list / Phone list:** one sheet each, duplicates removed, export to
  **Excel** or **PDF**, or copy all.
- See `CMS_SETUP.md` for the full editor guide.

## Project layout

```
src/routes/            pages (file-based routing); admin.*.tsx = CMS
src/components/site/   public site components
src/components/admin/  CMS components (uploads, image checks, contact lists)
src/lib/cms.ts         public data layer (reads only published content)
supabase/migrations/   database schema, security rules, data fixes
public/site-images/    built-in images (formerly hosted by Lovable)
```
