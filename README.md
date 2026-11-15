# Yunusakintunde

Dr. Yunus Akintunde, Senator (Oyo Central) — 2027 Re-Election Website

 A reference mockup (revamped-ui-mockup-v4.html) is attached/described for structure — use it as the functional and content blueprint, but improve the visual polish, spacing, and interaction detail wherever you can do better than a static mockup. And use his images across the website

Build a professional, institutional website for a sitting Nigerian Senator, Dr. Yunus Akintunde, representing Oyo Central Senatorial District, who is seeking re-election in 2027. This is a REVAMP of a 2023 campaign site. The tone throughout should read as a confident incumbent presenting a four-year record as the case for a second term — evidence-led, not a generic campaign poster. Use React + Tailwind CSS.

Brand & design system

Primary color: deep institutional green #1F5C3B (hover #2A7349, light tint #E7F0EA, near-black #123424 for dark sections).

Accent color: muted gold #B8862E (hover #9C6F1E, light tint #F5EBD6) — used for eyebrows, status highlights, ribbons, and small accents only, never as a dominant color.

Background: warm off-white #F7F5EF, secondary panel background #F1EEE5, hairline borders #DCD7C9.

Text: ink #1C2420 for body, #5B6660 for secondary/muted text.

Headings: serif typeface (Newsreader from Google Fonts, weight 600). Body/UI: Public Sans (Google Fonts).

Sharp-ish corners (2–4px radius), hairline 1px borders as the default separator rather than heavy drop shadows.

Avoid generic AI-template tells: no all-caps section labels used as the only hierarchy device, no repeated "→" arrows on every single link, no identical rounded cards with the same soft shadow on every section, no full-width decorative color bars purely for ornament.

Signature component — the "status stamp": a small pill badge with a colored dot marking something as Delivered (green), In Progress (gold), or Upcoming (grey). Currently every one of the 2023 commitments is marked Delivered — build this as a genuine reusable status component (not hardcoded text) so it can be updated individually later if any item's status changes.

Improve on the reference mockup: refine spacing rhythm, add tasteful micro-interactions (subtle hover states, smooth section transitions), and polish the responsive breakpoints beyond what a static mockup can show.

Site structure (7 pages, shared header + footer)

Global header: logo mark (circular monogram "YA" using the Senator's real photo) + "Dr. Yunus Akintunde / Senator · Oyo Central" wordmark, nav links (Home, Record & Agenda, Biography, News, Gallery, Get Involved). Only one CTA button in the header nav bar: "Get Involved" (gold, filled) — do not add a second competing CTA button in the nav (no separate "Volunteer" or "Donate" button here; those live inside the Get Involved page itself).

Utility bar above the header: small "AKINTUNDE 2027" campaign tag, a one-line tagline, a "Get Involved" text link, and a Yorùbá language link.

Global footer: dark green background, 4-column layout — brand blurb, Explore links, Get Involved links (Volunteer, Newsletter, Support the Campaign, Report an Issue), Follow (social icons). Bottom bar with current-year copyright and Privacy Policy / Sitemap links.

1. Home

Hero: eyebrow "Oyo Central · Seeking re-election, 2027," headline along the lines of "Four years of delivery. Now, I'm asking Oyo Central to let us finish the job." One paragraph naming the record (38 projects, 6 bills, promise-tracker). A small gold "RE-ELECT 2027" ribbon on the portrait image. Two CTAs: primary gold "Stand With Dr. Yunus — 2027" and secondary outline "See My Full Record" (these page-level CTAs are fine to keep distinct from the nav bar's single "Get Involved" button).

4-column stat strip: Projects delivered, LGAs & wards reached, Bills sponsored, 2023 promises delivered (100%).

"Why Oyo Central should re-elect Akintunde" — 3 value-prop cards (a checkable record, an active Senate voice, a clear term-two plan).

"Latest from the office" — 3 news preview cards, each with a feature image (placeholder acceptable), date, headline, one-line summary, "Read update" link, plus a "View all news" button to the News page.

Full-width dark green quote block with a large serif pull-quote from the Senator, framed around delivering with evidence rather than only promising.

Endorsements section: 3 testimonial cards (party leadership, a community leader, a constituent) — real third-party validation, not decoration.

Closing CTA banner: "I can't finish this work without you" with a single "Stand With Dr. Yunus →" button.

2. Record & Agenda (replaces "Manifesto" + "Achievements")

Header explains this page is the accountability hub: proof of the first term, plus the plan for the second.

A toggle/tab control with two views:

"Promises Kept (2023–2026)": all 9 original 2023 commitments, each with a status stamp — all 9 currently marked Delivered, with a status-count summary (9 of 9 delivered).

"2027 Agenda": 5 forward-looking term-two pledges, explicitly built on top of what's already delivered (e.g. expand solar infrastructure, sponsor new legislation, launch recurring programs).

Below the toggle: an "evidence base" section — Senate/legislative record summary (bills sponsored, committee membership, town halls held) and a region-filterable list of community projects (Ibadan / Oyo / Ogbomoso / Others) with LGA/ward names, completion dates, and photos.

3. Biography

Leads with his current title: "Sitting Senator, Oyo Central Senatorial District, since 2023 — now seeking a second term in 2027."

Two-column layout: prose (early life, education, Trade Codes Limited business background) on one side; a vertical timeline on the other (1999–2003 Commissioner, 2011–2012 Commissioner for Works & Transport, 2014–2015 Executive Assistant to the Governor, 2015–2023 private sector, 2023–present Senator — highlight the current entry in gold).

4. News

Filter chips: All, Senate floor, Constituency, 2027 Campaign trail, Media coverage.

Grid of news cards, each with a feature image above the text (date/category, headline, one-line summary, "Read update" link).

5. Gallery

Filter chips: All, In Office, 2027 Campaign Trail, Projects, Videos, 2023 Archive.

4-column image grid (2-column on mobile) with category tag overlay per image.

Include at least one constituency-infrastructure visual styled as a night scene showing solar-powered street lighting, a borehole, and an ICT centre (e.g. Iroko Community) — this is a specific, deliberate image choice representing delivered infrastructure, not a generic daytime market photo.

2023 campaign assets are clearly labeled as an archived category, not presented as current content.

6. Get Involved (replaces plain "Contact")

Header: "Join the Akintunde 2027 campaign."

Two-column layout:

Left: contact info list (email, phone, constituency office address, office hours), and a single "Volunteer for 2027" button (gold). Below it, a small, low-emphasis text line: "Prefer to support the campaign financially instead? Learn how to contribute" — this must stay a quiet text link, never a prominent button — donations are not the primary ask of this page.

Right: a sign-up form card with fields for Full name, Email address and Phone number (side by side on desktop, stacked on mobile), LGA/Ward, an "I'd like to..." dropdown (get updates / volunteer / report an issue / host a town hall), and an optional message field.

Required consent checkbox above the submit button, worded along the lines of: "I consent to receive campaign updates and newsletters by email and/or phone from the Akintunde 2027 campaign, in line with the Privacy Policy. I can unsubscribe at any time." Link "Privacy Policy" to a real (even placeholder) privacy policy page. Do not let the form submit without this checkbox checked.

Content & tone rules

Never use first-mandate campaign language ("Vote for," as if for the first time). This is an incumbent's re-election case: lead with delivered record, then make the forward ask.

State "Senator, Oyo Central Senatorial District" clearly on the homepage hero and at the top of Biography.

Use "four years" (not "three") when referencing time in office, consistent with a 2023–2027 first term.

Use the current year in the footer copyright automatically (not hardcoded).

Where real data isn't supplied, use clearly realistic placeholder content (e.g. "6 bills sponsored") rather than leaving fields empty, so it's obvious what to replace later — and mark placeholder images explicitly (e.g. a labeled placeholder state) until real campaign photography is supplied.

Forms & data handling

Both the Get Involved form and any newsletter capture must collect explicit consent (the checkbox above) before submitting — treat this as a hard requirement, not a nice-to-have.

Structure the email/phone fields so they're easy to wire to a real ESP/CRM later (e.g. Mailchimp, a Google Sheet, or a lightweight backend) — don't hardcode form submission to nothing.

Responsiveness & accessibility

Fully responsive down to small mobile screens (~360px wide). On narrow screens: nav collapses to a menu button, secondary header buttons hide before the primary one does, decorative ribbons/badges reposition rather than clip off-screen, multi-column forms stack to one column.

Visible keyboard focus states on all interactive elements (nav links, buttons, form fields, filter chips).

Sufficient color contrast between green/gold text and background (WCAG AA minimum).

Respect reduced-motion preferences; keep animation subtle (page-load fade-ins are fine; avoid busy per-card hover animations everywhere).

Where to push beyond the reference mockup

The mockup this brief is based on is a static HTML wireframe — you have room to genuinely improve on it:

Real, smooth interactive states for the Promises Kept / 2027 Agenda toggle and Gallery/News filter chips.

Thoughtful image loading states for the feature images and gallery grid (skeleton loaders, not just blank boxes).

A working, validated multi-step or single-step form on Get Involved with clear success/error states.

Genuine mobile-first polish, not just "doesn't break" — test real touch-target sizing or comfortable thumb reach for the nav and primary CTAs.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://yunusakintunde.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b6e3bf96-cf07-45af-adbb-49ee60e48a3b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
