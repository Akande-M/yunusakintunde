import { db } from "@/lib/db";
import { hostBundledImages } from "@/lib/bundled-images";

/*
 * Site clean-up after QA:
 * - Political & Party Leadership becomes one page with four tabs (Constituency Engagements,
 *   Campaigns & Mobilisation, Stakeholder Engagements, Oversight); the four separate pages and
 *   their menu links are removed. Constituency Engagement & Public Communication moves to the
 *   Constituency Engagements tab. 18 APC campaign photos.
 * - Achievements: the remaining items without a photo get the closest real photo on the site.
 * - Infrastructure and Outreach: their sections are grouped into topic tabs.
 * - Student Educational Support moves from Infrastructure to Skills, Jobs & Empowerment.
 * - Sample content from the first build is taken down: placeholder endorsements and empty
 *   sample news stories (kept as drafts), and "12 LGAs" is corrected to 11.
 */

type Sec = Record<string, unknown> & {
  type: string;
  heading?: string;
  body?: string;
  tab?: string | undefined;
  lga?: string;
  images?: { url: string; caption: string }[];
};

const POL = "political-leadership-and-party-engagement";
const SUBS = [
  "constituency-engagements",
  "campaigns-and-mobilisation",
  "stakeholder-engagements",
  "oversight-and-institutional-engagement",
];

async function page(slug: string) {
  const { data, error } = await db
    .from("site_pages")
    .select("id,intro,sections")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d = data as { id: string; intro: string; sections: unknown };
  return { ...d, sections: (Array.isArray(d.sections) ? d.sections : []) as Sec[] };
}
async function save(slug: string, sections: Sec[]) {
  const res = await db
    .from("site_pages")
    .update({ sections: await hostBundledImages(sections) })
    .eq("slug", slug);
  if (res.error) throw res.error;
}

// ------------------------------------------------------------------ Political & Party Leadership
const CAMPAIGN_CAPTIONS = [
  "APC campaigns: greeting party members at a campaign event.",
  "APC campaigns: on stage at a rally, with the press.",
  "APC campaigns: on stage at a rally.",
  "APC campaigns: supporters with Let's Do More flags.",
  "APC campaigns: addressing supporters at a rally.",
  "APC campaigns: with party leaders on stage.",
  "APC campaigns: greeting guests at a campaign event.",
  "APC campaigns: the crowd at a campaign rally.",
  "APC campaigns: exchanging greetings at a campaign event.",
  "APC campaigns: speaking on stage at a rally.",
  "APC campaigns: with party leaders at a campaign event.",
  "APC campaigns: with party leaders at a campaign event.",
  "APC campaigns: speaking to the press.",
  "APC campaigns: with party leaders at a campaign event.",
  "APC campaigns: with party members.",
  "APC campaigns: speaking with the press.",
  "APC campaigns: arriving for a party event.",
  "APC campaigns: addressing a rally.",
];

async function political() {
  const main = await page(POL);
  if (!main) return;
  const subs = Object.fromEntries(
    await Promise.all(SUBS.map(async (s) => [s, await page(s)] as const)),
  ) as Record<string, Awaited<ReturnType<typeof page>>>;
  // Already done (no sub-pages left and the main page has tabs): nothing to do.
  if (!SUBS.some((s) => subs[s]) && main.sections.some((s) => s.tab)) return;

  const T = {
    con: "Constituency Engagements",
    cam: "Campaigns & Mobilisation",
    sta: "Stakeholder Engagements",
    ove: "Oversight",
  };
  const take = (slug: string, tab: string) =>
    (subs[slug]?.sections ?? []).map((s) => ({ ...s, tab }));

  const oversight = take("oversight-and-institutional-engagement", T.ove);
  const isComms = (s: Sec) =>
    /^Constituency Engagement & Public Communication/i.test(String(s.heading));
  const comms = oversight.filter(isComms).map((s) => ({ ...s, tab: T.con }));
  const ovIntro = subs["oversight-and-institutional-engagement"]?.intro ?? "";

  const keep = main.sections.filter((s) => s.type !== "subpages" && s.tab);
  const sections: Sec[] = [
    ...keep,
    ...take("constituency-engagements", T.con),
    ...comms,
    ...take("campaigns-and-mobilisation", T.cam),
    {
      type: "gallery",
      tab: T.cam,
      heading: "APC Campaigns",
      images: CAMPAIGN_CAPTIONS.map((caption, i) => ({
        url: `/site-images/campaign/${String(i + 1).padStart(2, "0")}-apc-campaign.jpg`,
        caption,
      })),
    },
    ...take("stakeholder-engagements", T.sta),
    ...(ovIntro
      ? [
          {
            type: "text",
            tab: T.ove,
            heading: "Oversight, Institutional Engagement & Constituency Communication",
            body: ovIntro,
            image: "",
            caption: "",
            imageSide: "right",
          } as Sec,
        ]
      : []),
    ...oversight.filter((s) => !isComms(s)),
  ];
  await save(POL, sections);

  // Remove the four separate pages and their menu links; the menu item stays a plain link.
  const menu = await db.from("menu_items").select("id,page_slug");
  if (menu.error) throw menu.error;
  for (const m of (menu.data ?? []) as { id: string; page_slug: string | null }[])
    if (m.page_slug && SUBS.includes(m.page_slug)) {
      const r = await db.from("menu_items").delete().eq("id", m.id);
      if (r.error) throw r.error;
    }
  for (const s of SUBS)
    if (subs[s]) {
      const r = await db.from("site_pages").delete().eq("slug", s);
      if (r.error) throw r.error;
    }
}

// ------------------------------------------------------------------ Achievements
const PHOTO: [RegExp, string[]][] = [
  [/streetlight|solar lighting/i, ["/site-images/fce-oyo/08-new-road-2.jpg"]],
  [
    /medical|health/i,
    ["/site-images/outreach/03-phc-building.jpg", "/site-images/outreach/04-phc-street.jpg"],
  ],
  [/un women|training/i, ["/site-images/skills/09-naptin-training-hall.jpg"]],
  [/scholarship|tuition/i, ["/site-images/infrastructure/13-pupils-in-new-classroom.jpg"]],
  [
    /market|cash|grant|mosque|church|tractor|farm/i,
    [
      "/site-images/infrastructure/14-commissioning-ribbon.jpg",
      "/site-images/infrastructure/15-commissioning-ribbon-2.jpg",
    ],
  ],
];

async function achievements() {
  const { data, error } = await db.from("achievement_cards").select("id,zone,items,extra_items");
  if (error) throw error;
  for (const [k, c] of (
    (data ?? []) as {
      id: string;
      zone: string;
      items: unknown[];
      extra_items: unknown[];
    }[]
  ).entries()) {
    if (c.zone === "Senate") continue;
    const fill = (list: unknown[]) =>
      (list ?? []).map((x, i) => {
        const it =
          typeof x === "string"
            ? { text: x, image: "" }
            : {
                text: String((x as { text?: string }).text ?? ""),
                image: String((x as { image?: string }).image ?? ""),
              };
        if (it.image) return it;
        const hit = PHOTO.find(([re]) => re.test(it.text));
        return hit ? { ...it, image: hit[1][(k + i) % hit[1].length]! } : it;
      });
    const items = fill(c.items);
    const extra = fill(c.extra_items);
    const res = await db
      .from("achievement_cards")
      .update(await hostBundledImages({ items, extra_items: extra }))
      .eq("id", c.id);
    if (res.error) throw res.error;
  }
}

// ------------------------------------------------------------------ Topic tabs
const INFRA_TABS: [string, RegExp][] = [
  ["Overview", /^Infrastructure Projects$/i],
  [
    "Education",
    /^(Education Infrastructure|Classroom Projects|Major Educational Infrastructure|FCE \(Special\)|ICT Centres|Commissioning of New Classrooms)/i,
  ],
  [
    "Water & Power",
    /^(Community Development|Solar-Powered Borehole|Light Up Oyo Central|Supporting Security|Electricity & Transformer)/i,
  ],
  ["Markets", /^Market Development/i],
  ["Roads & Commissioning", /^(Roads, Water and Classrooms|Project Commissioning)/i],
];
const OUTREACH_TABS: [string, RegExp][] = [
  ["Community Outreach", /^Community Outreach$/i],
  ["Eye Care", /^(Optical Medical Outreach|Outreach Coverage|Specialised Eye Surgery)/i],
  ["Healthcare", /^(Medical Facilities|Healthcare Facilities)/i],
];

/** Puts whole-district sections into topic tabs, in tab order, ahead of the local government tabs. */
function tabbed(secs: Sec[], rules: [string, RegExp][]): Sec[] {
  const tabOf = (s: Sec) =>
    s.lga || s.type === "topic" || s.type === "areas" || s.type === "projects"
      ? undefined
      : s.tab || rules.find(([, re]) => re.test(String(s.heading ?? "")))?.[0];
  const withTabs = secs.map((s) => ({ ...s, tab: tabOf(s) ?? s.tab }));
  const order = rules.map(([t]) => t);
  const inTab = withTabs
    .filter((s) => s.tab && !s.lga)
    .sort((a, b) => order.indexOf(a.tab!) - order.indexOf(b.tab!));
  const rest = withTabs.filter((s) => !(s.tab && !s.lga));
  const firstLocal = rest.findIndex((s) => s.lga || s.type === "topic");
  const at = firstLocal < 0 ? rest.length : firstLocal;
  return [...rest.slice(0, at), ...inTab, ...rest.slice(at)];
}

async function topicTabs() {
  const infra = await page("infrastructure-projects");
  let support: Sec | undefined;
  if (infra) {
    support = infra.sections.find((s) => /^Student Educational Support$/i.test(String(s.heading)));
    const secs = infra.sections.filter((s) => s !== support);
    await save("infrastructure-projects", tabbed(secs, INFRA_TABS));
  }
  const out = await page("outreach");
  if (out) await save("outreach", tabbed(out.sections, OUTREACH_TABS));

  // Student Educational Support belongs with jobs and education support on Skills.
  const skills = await page("skills-jobs-and-empowerment");
  if (skills && support && !skills.sections.some((s) => s.heading === support!.heading)) {
    const secs = [...skills.sections];
    const at = secs.findIndex((s) => /^Access to Higher Education/i.test(String(s.heading)));
    secs.splice(at >= 0 ? at + 1 : secs.length, 0, { ...support, tab: "Jobs & Human Capital" });
    await save("skills-jobs-and-empowerment", secs);
  }
}

// ------------------------------------------------------------------ Sample content
async function samples() {
  const e = await db.from("endorsements").select("id,name");
  if (!e.error)
    for (const r of (e.data ?? []) as { id: string; name: string }[])
      if (/[[\]]|\b(party leader|community leader|constituent) name\b/i.test(r.name)) {
        const res = await db.from("endorsements").update({ published: false }).eq("id", r.id);
        if (res.error) throw res.error;
      }
  // Sample news stories from the first build have no text: keep them as drafts.
  const n = await db.from("news_posts").select("id,body,status");
  if (n.error) throw n.error;
  for (const r of (n.data ?? []) as { id: string; body: string | null; status: string }[])
    if (r.status === "published" && !(r.body ?? "").trim()) {
      const res = await db.from("news_posts").update({ status: "draft" }).eq("id", r.id);
      if (res.error) throw res.error;
    }
  // Oyo Central has 11 local governments.
  const h = await db.from("site_settings").select("value").eq("key", "home").maybeSingle();
  if (h.error) throw h.error;
  const home = (h.data as { value: { stats?: { n: string; l: string }[] } } | null)?.value;
  if (home?.stats?.some((s) => s.n === "12" && /LGA/i.test(s.l))) {
    home.stats = home.stats.map((s) =>
      s.n === "12" && /LGA/i.test(s.l) ? { n: "11", l: "Local governments reached" } : s,
    );
    const res = await db
      .from("site_settings")
      .upsert({ key: "home", value: home }, { onConflict: "key" });
    if (res.error) throw res.error;
  }
}

export async function applyCleanup(progress: (msg: string) => void) {
  progress("Putting Political & Party Leadership into one page with tabs…");
  await political();
  progress("Adding photos to the remaining achievements…");
  await achievements();
  progress("Grouping Infrastructure and Outreach into tabs…");
  await topicTabs();
  progress("Taking down sample content…");
  await samples();
}
