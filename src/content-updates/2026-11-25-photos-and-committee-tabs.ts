import { db } from "@/lib/db";
import { hostBundledImages } from "@/lib/bundled-images";
import { STOCK_IMAGES } from "@/lib/cms";

/*
 * 1. Achievements: every item gets a real photo of the same kind of project where the site has
 *    one (boreholes, roads, classrooms, ICT centres, skills training). Schools renovated get
 *    school and classroom photos. Photos already set in the CMS are kept.
 * 2. Committees & Oversight: all sections go into tabs; the Canadian High Commissioner photos
 *    become one section with two photos; Committee Work photos split into their committees.
 * 3. Bills & Motions: the Committee Work photos are removed (they now live on Committees).
 * 4. Template stock pictures are taken off the pages and the media gallery.
 */

type Item = { text: string; image: string };
type Sec = Record<string, unknown> & {
  type: string;
  heading?: string;
  image?: unknown;
  caption?: unknown;
  body?: unknown;
  images?: { url: string; caption: string }[];
  tab?: string;
};

const E = "/site-images/education/";
const I = "/site-images/infrastructure/";
const S = "/site-images/skills/";
const L = "/site-images/legislative/";
const O = "/site-images/oversight/";
const R = "/site-images/recognition/";

const POOLS: Record<string, string[]> = {
  water: [
    `${I}05-solar-borehole-collage.jpg`,
    `${I}02-borehole-oyo-east.jpg`,
    `${I}01-borehole-oyo-west.jpg`,
    `${I}03-borehole-oyo-east-2.jpg`,
  ],
  road: [`${I}07-asphalted-road.jpg`, `${I}08-asphalted-road-2.jpg`],
  ict: [
    `${E}02-ict-centre-computers.jpg`,
    `${E}06-ict-centre-computers-2.jpg`,
    `${E}03-ict-centre-hall.jpg`,
  ],
  skills: [
    `${S}05-digital-skills-participants.jpg`,
    `${S}06-digital-skills-graduates.jpg`,
    `${S}02-laptop-presentation.jpg`,
    `${S}04-digital-skills-dignitaries.jpg`,
    `${S}01-laptops-for-artisans.jpg`,
    `${S}03-digital-skills-backpacks.jpg`,
  ],
  solarpv: [`${S}12-naptin-group-photo.jpg`, `${S}09-naptin-training-hall.jpg`],
  school: [
    `${E}05-ict-centre-building-2.jpg`,
    `${I}06-classroom-block-commissioning.jpg`,
    `${E}01-ict-centre-building.jpg`,
    `${E}09-classroom-block-under-construction.jpg`,
    `${E}07-classrooms-under-construction.jpg`,
    `${E}08-building-under-construction.jpg`,
  ],
};

/** Which pool fits an item, or null when the site has no real photo of that kind yet. */
function poolFor(text: string): string | null {
  const t = text.toLowerCase();
  if (/^(empowerment|training) .*(trades|skills)/.test(t)) return "skills";
  if (
    /streetlight|solar lighting|scholarship|tuition|medical|health|tractor|farm|cash|grant|market|mosque|church|palace|worship|women|girls/.test(
      t,
    )
  )
    return null;
  if (/borehole|water/.test(t)) return "water";
  if (/solar pv|naptin/.test(t)) return "solarpv";
  if (/\bict\b|tablet|computer/.test(t)) return "ict";
  if (
    /gsm|tailoring|sewing|grinding|welding|mechanic|artisan|trades|skills|equipment|empower/.test(t)
  )
    return "skills";
  if (/road|drainage/.test(t)) return "road";
  if (/classroom|school|e-library|hall/.test(t)) return "school";
  return null;
}

const asItems = (v: unknown): Item[] =>
  Array.isArray(v)
    ? v
        .map((x) =>
          typeof x === "string"
            ? { text: x, image: "" }
            : { text: String(x?.text ?? ""), image: String(x?.image ?? "") },
        )
        .filter((x) => x.text.trim())
    : [];

async function achievementPhotos() {
  const { data, error } = await db
    .from("achievement_cards")
    .select("id,title,zone,items,extra_items,sort_order")
    .order("sort_order");
  if (error) throw error;
  const rows = (data ?? []) as { id: string; zone: string; items: unknown; extra_items: unknown }[];
  for (const [k, r] of rows.entries()) {
    if (r.zone.toLowerCase() === "senate") continue;
    const used: Record<string, number> = {};
    const pick = (pool: string) => {
      const list = POOLS[pool]!;
      const n = used[pool] ?? 0;
      used[pool] = n + 1;
      return list[(k + n) % list.length]!;
    };
    const items = asItems(r.items).map((it) => {
      if (it.image) return it;
      const pool = poolFor(it.text);
      return pool ? { ...it, image: pick(pool) } : it;
    });
    const extra = asItems(r.extra_items).map((it) =>
      it.image ? it : { ...it, image: pick("school") },
    );
    const res = await db
      .from("achievement_cards")
      .update({
        items: await hostBundledImages(items),
        extra_items: await hostBundledImages(extra),
      })
      .eq("id", r.id);
    if (res.error) throw res.error;
  }
}

async function loadPage(slug: string) {
  const { data, error } = await db
    .from("site_pages")
    .select("sections,hero_image")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d = data as { sections: unknown; hero_image: string | null };
  return {
    sections: (Array.isArray(d.sections) ? d.sections : []) as Sec[],
    hero: d.hero_image ?? "",
  };
}

async function savePage(slug: string, fields: Record<string, unknown>) {
  const hosted = await hostBundledImages(fields);
  const res = await db.from("site_pages").update(hosted).eq("slug", slug);
  if (res.error) throw res.error;
}

const gallery = (heading: string, tab: string, imgs: [string, string][]): Sec => ({
  type: "gallery",
  heading,
  tab,
  images: imgs.map(([url, caption]) => ({ url, caption })),
});
const byFile = (secs: Sec[], file: string) => {
  for (const s of secs) {
    for (const im of s.images ?? []) if (im.url.includes(file)) return im.url;
    if (typeof s.image === "string" && s.image.includes(file)) return s.image;
  }
  return "";
};

async function committees() {
  const slug = "committees-and-oversight";
  const page = await loadPage(slug);
  if (!page) return;
  const secs = page.sections;
  if (secs.some((s) => s.tab)) return; // already arranged in tabs
  const find = (re: RegExp) => secs.find((s) => re.test(String(s.heading ?? "")));
  const LEAD = "Leadership & Membership";
  const POLICE = "Police Affairs";
  const ENV = "Environment";
  const APPROP = "Appropriations";
  const out: Sec[] = [];

  const chair = find(/^Committee Chairmanship/i);
  const deputy = find(/^Deputy Chairmanship/i);
  const members = find(/^Committee Membership/i);
  const closing = secs.find((s) => s.type === "text" && !s.heading && !s.image);
  if (chair)
    out.push({
      ...chair,
      tab: LEAD,
      image: `${R}13-senate-committee-sitting.jpg`,
      caption: "At a Senate committee sitting.",
    });
  if (deputy) out.push({ ...deputy, tab: LEAD });
  if (members) out.push({ ...members, tab: LEAD });
  if (closing) out.push({ ...closing, tab: LEAD });

  const police = find(/^Police Affairs Engagements/i);
  out.push({
    type: "text",
    tab: POLICE,
    heading: "Deputy Chairman, Senate Committee on Police Affairs",
    body: "As Deputy Chairman of the Senate Committee on Police Affairs, Senator Akintunde takes part in the committee's oversight of the Nigeria Police Force, including engagements with the police leadership and with police retirees on their welfare and the Contributory Pension Scheme.",
    image: `${L}38-police-retirees.jpg`,
    caption: "Engagement with police retirees at the National Assembly.",
    imageSide: "right",
  });
  if (police) out.push({ ...police, tab: POLICE, heading: "Police affairs engagements" });

  // Environment: the Canadian High Commissioner story, now one section with two photos.
  const oversight =
    find(/^Oversight$/i) ??
    secs.find((s) => /Canadian High Commissioner/i.test(String(s.body ?? "")));
  const envGallery = find(/^Environmental Oversight/i);
  const second = envGallery?.images?.[0];
  if (oversight)
    out.push({
      ...oversight,
      tab: ENV,
      heading: "Environmental Oversight: Meeting the Canadian High Commissioner",
      image2: second?.url || `${O}01-canadian-high-commissioner.jpg`,
      caption2:
        second?.caption ||
        "With the Canadian High Commissioner, James Christoff, and Mr Micheal Murphy, Adviser, Political Affairs.",
    });
  const env = [29, 30, 31]
    .map(
      (n) =>
        byFile(secs, `${n}-environment`) ||
        `${L}${n}-${["environment-minister", "environment-ministry-meeting", "environment-ministry-group"][n - 29]}.jpg`,
    )
    .map((url): [string, string] => [
      url,
      "Environment committee leadership with the Minister of Environment.",
    ]);
  out.push(gallery("With the Minister of Environment", ENV, env));

  const app = [32, 33, 34, 35]
    .map(
      (n, i) =>
        byFile(secs, `${n}-appropriations`) ||
        `${L}${n}-appropriations-committee${i ? `-${i + 1}` : ""}.jpg`,
    )
    .map((url): [string, string] => [url, "Senate Committee on Appropriations."]);
  out.push({
    type: "text",
    tab: APPROP,
    heading: "Member, Senate Committee on Appropriations",
    body: "Senator Akintunde serves on the Senate Committee on Appropriations, which considers the federal budget.",
    image: "",
    caption: "",
    imageSide: "right",
  });
  out.push(gallery("At the Appropriations Committee", APPROP, app));

  // Anything else on the page that wasn't placed above stays, in a "More" tab.
  const placed = new Set(
    [chair, deputy, members, closing, police, oversight, envGallery].filter(Boolean),
  );
  for (const s of secs)
    if (!placed.has(s) && !/^Committee Work$/i.test(String(s.heading ?? "")))
      out.push({ ...s, tab: "More" });

  await savePage(slug, { sections: out });
}

async function bills() {
  const page = await loadPage("bills-and-motions");
  if (!page) return;
  const next = page.sections.filter((s) => !/^Committee Work$/i.test(String(s.heading ?? "")));
  if (next.length !== page.sections.length) await savePage("bills-and-motions", { sections: next });
}

const isStockUrl = (u: unknown) =>
  typeof u === "string" && STOCK_IMAGES.some((s) => u.split("#")[0]!.endsWith(s));

/** Real photos to use instead of template stock heroes. */
const HEROES: Record<string, string> = {
  "infrastructure-projects": `${I}07-asphalted-road.jpg`,
  "constituency-interventions-and-development-projects": `${I}06-classroom-block-commissioning.jpg`,
  "skills-jobs-and-empowerment": `${S}05-digital-skills-participants.jpg`,
};

async function retireStock() {
  const { data, error } = await db.from("site_pages").select("slug,hero_image,hero_alt,sections");
  if (error) throw error;
  for (const p of (data ?? []) as {
    slug: string;
    hero_image: string;
    hero_alt: string;
    sections: Sec[];
  }[]) {
    let changed = false;
    const fields: { hero_image?: string; hero_alt?: string } = {};
    if (isStockUrl(p.hero_image)) {
      fields.hero_image = HEROES[p.slug] ?? "";
      fields.hero_alt = HEROES[p.slug] ? p.hero_alt : "";
      changed = true;
    }
    const sections = (Array.isArray(p.sections) ? p.sections : []).map((s) => {
      const n = { ...s };
      if (isStockUrl(n.image)) {
        n.image = "";
        n.caption = "";
        changed = true;
      }
      if (n.images) {
        const keep = n.images.filter((im) => !isStockUrl(im.url));
        if (keep.length !== n.images.length) changed = true;
        n.images = keep;
      }
      return n;
    });
    if (changed) await savePage(p.slug, { ...fields, sections });
  }
  // Media gallery: hide the stock pictures and correct the captions on the studio portraits.
  const g = await db.from("gallery_items").select("id,url,caption");
  if (g.error) throw g.error;
  for (const r of (g.data ?? []) as { id: string; url: string; caption: string }[]) {
    if (isStockUrl(r.url)) {
      const res = await db.from("gallery_items").update({ published: false }).eq("id", r.id);
      if (res.error) throw res.error;
    } else if (/yunus_biography[23]\.jpg$/.test(r.url) && /rally|meet-up/i.test(r.caption)) {
      const res = await db
        .from("gallery_items")
        .update({
          caption: "Senator Yunus Abiodun Akintunde, PhD",
          alt: "Portrait of Senator Akintunde",
        })
        .eq("id", r.id);
      if (res.error) throw res.error;
    }
  }
}

export async function applyPhotosAndCommitteeTabs(progress: (msg: string) => void) {
  progress("Adding photos to the achievement cards…");
  await achievementPhotos();
  progress("Arranging Committees & Oversight into tabs…");
  await committees();
  progress("Tidying Bills & Motions…");
  await bills();
  progress("Replacing template stock pictures…");
  await retireStock();
}
