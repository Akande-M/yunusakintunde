# Website CMS — setup & handover

The site now has a built-in admin at **`/admin`**. Everything that used to be hardcoded in
`src/lib/site-data.ts` (news, gallery, projects, promises, endorsements, contact details) is
editable there, and **Get Involved sign-ups are now saved** (before this, they were only
logged and then lost, because no webhook was configured).

## 1. Deploy (one time, ~10 minutes)

1. **Upload the files to GitHub.** Unzip the package. On github.com/Akande-M/yunusakintunde, click
   **Add file → Upload files**, drag in the `src` and `supabase` folders plus this file,
   and click **Commit changes**. Existing files get replaced; that's expected.
2. **Wait for Lovable to sync.** Open the project in Lovable. The commit shows up in the history within a minute or two.
3. **Create the database tables.** In the Lovable chat, send:
   > Apply the two SQL migrations in `supabase/migrations/` (`20261116090000_cms_schema.sql`, then
   > `20261116090100_cms_seed.sql`) to the Cloud database exactly as written. Do not change any other code.

   Approve the migration when Lovable asks. The seed copies today's content in, so the live site
   looks exactly the same afterwards.
4. **Publish** in Lovable.
5. **Create the first admin.** Go to **`<your-site>/admin/setup`**, enter the private setup code (sent
   separately; it is *not* in this repo), and enter the senator's team lead's name, email and a password.
   This page stops working as soon as one admin exists.
6. **Recommended:** in Lovable Cloud → Users/Auth settings, turn **off public sign-ups**. Staff
   accounts are only ever created from the admin's Team page.

> Until step 3 is done, the site keeps showing the original built-in content, so nothing breaks
> in between.

## 2. Who can do what

| | Editor | Admin |
|---|---|---|
| Write, edit, publish, unpublish news | ✅ | ✅ |
| Photos, videos, projects, promises, endorsements, homepage text, contact, socials | ✅ | ✅ |
| View sign-ups, mark them followed up, export to Excel | ✅ | ✅ |
| Delete sign-ups | — | ✅ |
| Add/remove team members, reset passwords, change roles | — | ✅ |

**Adding someone:** Team → Add team member. The site creates a temporary password. Copy the
message and send it privately (WhatsApp/call). They choose their own password at first sign-in.
**Forgotten password:** an admin clicks the key icon on that person's row.

## 3. Day-to-day

- **News.** *Publish* puts a story live immediately. Set a future date to schedule it. A story with no
  "Full story" text shows as a card only ("Full story coming soon"). Changing the web address of a
  live story breaks links that were already shared.
- **Media.** Upload several photos at once; they're shrunk automatically for mobile data. For videos,
  paste a **YouTube link** (best for anything long) or upload a short clip (50 MB max).
- **Homepage campaign film.** Site content → Homepage → paste the YouTube link. The placeholder
  disappears automatically.
- **Sign-ups.** Call or WhatsApp straight from the list, and tick "Followed up" when done. Export gives a
  CSV that opens in Excel or Google Sheets.
- **Placeholders.** Fields still containing `[brackets]` or the dummy phone number show a ⚠ warning.

## 4. Optional: forward sign-ups somewhere else

Sign-ups are always stored in the database. To *also* push each one to Mailchimp, Google Sheets,
Zapier or a CRM, add a secret **`SIGNUP_WEBHOOK_URL`** in Lovable Cloud → Secrets pointing at that
tool's webhook URL. The form only tells a visitor "success" if at least one of the two actually stored it.

## 5. Technical notes

- Tables: `news_posts`, `gallery_items`, `projects`, `commitments`, `endorsements`, `site_settings`,
  `signups`, `user_roles`. Storage bucket: `media` (public read, staff write, 50 MB/file).
- Row-level security: the public reads only published rows; only staff (`user_roles`) can write;
  nobody can grant themselves a role (roles are changed only by admin-checked server functions using
  the service role). `created_by` / `updated_by` are stamped automatically on every change.
- The public read layer (`src/lib/cms.ts`) always filters to published content, and falls back to the
  original static content if the database is unreachable.
- `src/lib/db.ts` uses a loosely-typed client, so the code compiles both before and after Lovable
  regenerates `integrations/supabase/types.ts`.
- Not yet in the CMS (still in code): the Biography page and the three "evidence" cards on Record &
  Agenda. The site header name and role also still come from `src/lib/site-data.ts`.

## Update 3 (Nov 2026): Major achievements + Support page

- **Homepage → Major achievements:** one card per local government (7 at launch) plus a
  Legislative Duties card, sliding right to left on their own. Editors manage them under
  **Admin → Achievements**: one achievement per line; figures are bolded and icons picked
  automatically. Add Oyo zone LGAs there.
- **/support:** the shareable "I SUPPORT SENATOR AKINTUNDE FOR 2027" card. On phones,
  "Share image" sends the picture itself to WhatsApp/Status/Instagram/Facebook. On computers it
  downloads, and link shares show the card as their preview. The photo and both logos are
  replaceable under Site content → Images ("Support card photo", "Support card: APC logo &
  thumbprint", "Support card: Senate logo").
- `public/support-card.jpg` is the pre-made preview image used by WhatsApp/Facebook link
  previews. If the support photo is changed, ask a developer to regenerate it.
- Database: apply `supabase/migrations/20261118090000_cms_achievements.sql`
  (and `20261117090000_cms_images_footer_copy.sql` if not applied yet).

## Update 5 (Nov 2026): View all achievements + photos

- **/achievements** shows every card at a glance: totals strip (LGAs, projects, streetlights,
  patients, added up from the wording), zone filter, and a photo tile for every achievement.
- **Admin → Achievements:** page heading/intro, the "Let's do more" tagline and the Senator's
  portrait (shown on every carousel card), and an **Add photo** button on every achievement.
  Achievements without a photo show a matching icon.
- Use only real photos of the actual projects. Don't use stock or internet images.
- Database: apply `supabase/migrations/20261118120000_cms_achievements_page.sql`.

## Update 6 (Nov 2026): images uploaded in the CMS always show

- Uploads are converted to web-safe formats automatically (iPhone/Mac **HEIC** photos → JPEG),
  and each upload is checked to load for visitors before it's accepted.
- Pasted image links that don't load are flagged in red.
- Site content page: a "Save all changes" bar appears whenever something isn't saved yet.
  Uploading a photo is not enough. It goes live only after saving.
- Admin dashboard → **Check all images** lists any image visitors can't see, with a Fix link.
- Storage: the `media` bucket must be **public**
  (`supabase/migrations/20261118140000_media_bucket_public.sql`).

## Update 7 (Nov 2026): moved off Lovable hosting + contact lists

**Sign-ups → Email list / Phone list:** one sheet each (duplicates removed, newest details
kept, numbers also given in +234 WhatsApp format). Export to **Excel** or **PDF**, or **Copy all**
(emails comma-separated for BCC, numbers one per line). The interest filter and search apply.

**Hosting:** the site now builds with standard tooling and deploys to **Vercel** (see README).
The database, logins and uploaded photos stay on **Lovable Cloud**.

### Go-live order (important)
1. In the Lovable chat, apply these migrations **in this order** *before* switching to Vercel
   (the new sign-up form relies on step c):
   a. `20261118120000_cms_achievements_page.sql` (skip if already applied)
   b. `20261118140000_media_bucket_public.sql` (harmless if storage is already public)
   c. `20261121090000_no_service_role.sql`
   d. `20261121100000_self_hosted_image_urls.sql`
2. Lovable → Cloud → Users → Auth settings: keep **sign-ups enabled**; add your Vercel URL and
   `https://yunusakintunde.com/**` to the allowed redirect URLs.
3. Deploy to Vercel (README). The build downloads the 20 built-in images automatically;
   run `npm run images` once locally and commit `public/site-images/` to remove the last
   dependency on Lovable hosting.
4. Point `yunusakintunde.com` at Vercel (Vercel → Domains shows the DNS records).
5. In Lovable → Project settings → GitHub: **disconnect** the repo, so Lovable's builder no longer
   edits this code. Keep the Lovable project itself: it hosts the database.

### Team changes
Adding staff no longer creates passwords. **Team → Invite**: the person creates their own
account at `/admin` ("Invited? Create your account"), confirms their email, and is given the
role automatically. Password resets are emailed ("Forgot password?" / key icon on Team).

## Update 8 (Nov 2026): database catch-up for Vercel
If the Team page says "Could not find the function public.list_staff", or the Get Involved form
fails on Vercel, the database update hasn't been applied yet. Open the Lovable project chat and send:
*"Run the SQL in supabase/APPLY_IN_LOVABLE.sql on the Cloud database exactly as written, as one migration."*
(If Lovable is disconnected from GitHub, paste the file's contents into the chat instead.)
New sign-up option: "Share project testimonial".

## Update 9 (Nov 2026): new menu, Pages and Menu editors
**Apply the database update first.** In the Lovable project chat, send:
*"Run the SQL in supabase/migrations/20261123090000_cms_pages_and_menu.sql on the Cloud database
exactly as written, as one migration."* Until it runs, the site shows a basic built-in menu
(Home, About, News & Media) and the Pages and Menu screens show a warning.

What's new:
- **Top menu**: Home · About · Legislative Work · Political & Party Leadership · News & Media, then
  the Get in touch button. Items with sub-links open on hover (and on click or keyboard). On phones,
  they open as an accordion. The APC Candidate badge is no longer in the header.
- **Admin → Pages**: the pages under the menu (Bills & Motions, Committees & Oversight, Outreach,
  Infrastructure Projects, Skills, Jobs & Empowerment, Recognition, Campaigns & Mobilisation,
  Constituency Engagements, Stakeholder Engagements, and any new ones). Each page has a title, a
  main photo, an intro and a list of sections:
  - Text (with an optional photo), Cards with photos, Photo gallery: typed in on the page.
  - Projects list, Bills & motions, Achievements by topic: pulled from Record & Agenda → Projects
    and Achievements, so you edit that content once and it updates everywhere.
  Use **Preview** to see unsaved changes. **Publish** puts it live. A **draft** is never shown to
  visitors. Its menu link opens a "Coming soon" page until you publish it.
- **Admin → Menu**: rename, reorder, show or hide, move under another item, or add links (to a
  page, a built-in page or any web address) up to three levels deep.
- The old **Record & Agenda** page is split: the promise tracker and 2027 agenda are now at the
  bottom of **Achievements**, and the projects list is on **Infrastructure Projects**.
  `/record-agenda` redirects to Achievements. (The admin screen is still called Record & Agenda.)

## Update 10 (Nov 2026): new header design
**Apply the database update first.** In the Lovable chat, send: *"Run the SQL in
supabase/migrations/20261123130000_header_and_menu_icons.sql on the Cloud database exactly as
written, as one migration."* Until it runs, the header uses its default wording and the icons are
picked automatically. The site works either way.

- Two-tier header: a green top bar (phone, email, "Follow us" with Facebook, X, YouTube and
  Instagram icons) above the dark green main bar (logo, menu, "Get in touch" button).
- **Admin → Site content → Header**: show or hide the top bar, phone, email and social icons; the
  "Follow us" text, the name beside the logo, and the button text and link.
- Social icons become clickable once their links are added under **Social links**.
- The phone number stays hidden while the Contact details phone is still a placeholder.
- Menu groups open a full-width panel listing their links with icons. Constituency Interventions
  & Development Projects opens its own drop-down beneath it.
- **Admin → Menu**: each link has an **Icon** choice ("Automatic" picks one from the wording).
- The active menu link is bold with a thick gold underline.
- Footer copyright: `{year}` is replaced with the current year (stray braces like `{2026}` are removed).

## Update 11 (Nov 2026): Recognition page, everything under Pages
**Apply the database update first.** In the Lovable chat, send: *"Run the SQL in
supabase/migrations/20261124090000_recognition_and_page_text.sql on the Cloud database exactly as
written, as one migration."* It fills in and publishes the Recognition page (only if it is still the
untouched draft) and lets the website read the Biography and page-heading text.
**Delete `src/routes/admin.menu.tsx`** in GitHub: the Menu screen has been removed.

- **Recognition** (About → Recognition): introduction, the honours text, a numbered list of public
  service roles and a photo gallery of 14 pictures with captions. Edit any of it in Pages →
  Recognition. Photos open large when clicked.
- **New section type, "Numbered list"**: one item per line, numbered automatically.
- **Pages** now lists every page. Main pages (Home, Header & top menu bar, Biography,
  Achievements, News & Updates, Media Gallery) open their own editors. **Achievements** and the
  new **Biography** editor live here, not in the sidebar.
- **Biography editor**: introduction, APC badge on/off, key facts, story, both photos, timeline.
- **News and Media**: the heading at the top of each page is editable ("Page heading" panel).
- **Menu screen removed.** Each page in Pages has a **Top menu** box: not in the menu, on the main
  bar, or under a group, plus the menu text and its position. Deleting a page also removes its
  menu link. Menu icons are picked automatically from the link text.
