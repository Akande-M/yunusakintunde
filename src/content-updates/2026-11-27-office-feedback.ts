import { db } from "@/lib/db";

/*
 * The office's feedback of 27 Nov 2026 ("detailed responses to the observations"):
 * - the 2023 manifesto scorecard (11 promises, statuses the office confirmed);
 * - the 2027 agenda hidden until the current manifesto is supplied;
 * - one set of key figures for the homepage and Achievements;
 * - no repeated photos: stand-in photos taken off the achievement cards, each photo kept
 *   in one place only;
 * - Recognition reorganised with an awards showcase, and COP29 added;
 * - Biography headline, contact details, a press date, tab names and the menu.
 */

type Sec = Record<string, unknown> & {
  type: string;
  heading?: string;
  tab?: string;
  lga?: string;
  image?: string;
  image2?: string;
  caption?: string;
  caption2?: string;
  body?: string;
  items?: unknown[];
  images?: { url: string; caption: string }[];
};

/** File name without the 8-character upload prefix, e.g. "02-borehole-oyo-east.jpg". */
const fileKey = (url: string) =>
  (url.split("#")[0]!.split("/").pop() ?? url).replace(/^[0-9a-f]{8}-/, "").toLowerCase();

async function readSetting(key: string): Promise<Record<string, unknown>> {
  const r = await db.from("site_settings").select("value").eq("key", key).maybeSingle();
  if (r.error) throw r.error;
  return ((r.data as { value: Record<string, unknown> } | null)?.value ?? {}) as Record<
    string,
    unknown
  >;
}
async function writeSetting(key: string, value: unknown) {
  const r = await db.from("site_settings").upsert({ key, value }, { onConflict: "key" });
  if (r.error) throw r.error;
}

async function editPage(
  slug: string,
  fn: (secs: Sec[]) => Sec[] | void,
  fields: Record<string, unknown> = {},
) {
  const { data, error } = await db
    .from("site_pages")
    .select("sections")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  const secs = ((data as { sections: unknown } | null)?.sections ?? null) as Sec[] | null;
  if (!Array.isArray(secs)) return;
  const out = fn(secs) ?? secs;
  const r = await db
    .from("site_pages")
    .update({ ...fields, sections: out })
    .eq("slug", slug);
  if (r.error) throw r.error;
}

const find = (secs: Sec[], re: RegExp, extra: (s: Sec) => boolean = () => true) =>
  secs.find((s) => re.test(String(s.heading ?? "")) && extra(s));
const dropImage = (s: Sec | undefined) => {
  if (!s) return;
  s.image = "";
  s.caption = "";
  if ("image2" in s) {
    s.image2 = "";
    s.caption2 = "";
  }
};
const dropFromGallery = (s: Sec | undefined, ...keys: string[]) => {
  if (s?.images) s.images = s.images.filter((im) => !keys.includes(fileKey(im.url)));
};

// ------------------------------------------------------------------ 2023 manifesto scorecard
const PROMISES: { title: string; status: string; detail: string }[] = [
  {
    title: "An all-inclusive qualitative representation at the Nigerian Senate",
    status: "Delivered",
    detail:
      "Active in plenary and committees of the 10th Senate: Pioneer Chairman, Senate Committee on South West Development Commission; Deputy Chairman, Senate Committee on Police Affairs; former Chairman, Senate Committee on Environment; and a member of 15 Senate committees.",
  },
  {
    title: "Sponsoring of beneficial bills",
    status: "Delivered",
    detail:
      "7 bills sponsored and supported, including the Federal University of Education (Special), Oyo, the Federal Polytechnic, Ayede, the Federal University of Geomatics and a 100-bed Mother and Child Hospital at Ona-Ara, plus motions on electricity tariffs, the resident doctors’ strike and the welfare of retired police officers.",
  },
  {
    title:
      "Facilitation or execution of laudable and impactful projects in all spheres of life in Oyo Central Senatorial District",
    status: "Delivered",
    detail:
      "{projects} projects and programmes recorded across the 11 local governments, including more than 9,000 solar streetlights, 89 solar-powered boreholes, classroom blocks, healthcare and roads. Some road and school projects are still ongoing or awarded, and are labelled as such.",
  },
  {
    title: "Easily accessible senatorial office/secretariat",
    status: "Delivered",
    detail:
      "A dedicated senatorial office in Owode, Oyo town. There is no office in Ibadan yet; 42 aides serve as liaison officers across the 11 local governments.",
  },
  {
    title: "Establishment of skills/vocational training centres in Oyo Central Senatorial District",
    status: "Not yet delivered",
    detail:
      "No dedicated vocational training centre has been established. What was done instead: skills programmes training 465 people in tailoring, 439 in ICT, 316 youths in phone repairs and 55 artisans in digital skills, with toolboxes for 100 mechanics and 100 welders and grinding machines for 250 women.",
  },
  {
    title:
      "Annual employability/career training/job fair for graduates in the senatorial district, so that graduates and artisans are not just qualified but also employable",
    status: "Not yet delivered",
    detail:
      "A job fair has not been held annually. What was done instead: 74 placements facilitated in federal institutions, admissions into the Nigeria Police Academy, Wudil, and the skills and digital training programmes.",
  },
  {
    title: "Facilitation of a tech/ICT hub for youths in the district",
    status: "Facilitated",
    detail:
      "Four ICT centres established in secondary schools: Ojoo Secondary School, Akinyele; Army Children Secondary School, Ojongbodu, Oyo West; Baptist Secondary Grammar School, Surulere; and Lagbedu Community High School, Ogo-Oluwa. A separate youth tech hub has not yet been established.",
  },
  {
    title: "Establishment of an inter-party/community assembly of 5 critical stakeholders per ward",
    status: "Not yet delivered",
    detail:
      "Not set up as five stakeholders per ward. What is done instead: stakeholder meetings bring together party leaders from every local government, and 42 aides serve as liaison officers and special assistants across the district.",
  },
  {
    title: "Quarterly medical check/health awareness programmes",
    status: "Facilitated",
    detail:
      "Medical outreaches, health screening, vaccination support, referrals and an optical outreach for 3,680 people across the 11 local governments, though not on a quarterly schedule.",
  },
  {
    title: "Quarterly town hall meetings with constituents",
    status: "Not yet delivered",
    detail:
      "Quarterly town halls have not been held. What is done instead: the Senator sponsors the weekly IGBALAYE radio programme on Dynasty FM, Oyo, and Agidigbo FM, Ibadan, and joins call-in programmes to hear directly from constituents.",
  },
  {
    title:
      "Support the political developments in Oyo Central Senatorial District and the state at large",
    status: "Delivered",
    detail:
      "Party reconciliation, support for candidates in the 2024 local government elections and the 2025 Ibadan North bye-election, five campaign buses for support groups, and national APC assignments.",
  },
];

const DB_STATUS: Record<string, "delivered" | "progress" | "upcoming"> = {
  Delivered: "delivered",
  Facilitated: "progress",
  Ongoing: "progress",
  "Not yet delivered": "upcoming",
};

async function scorecard() {
  const cur = await db.from("commitments").select("id,list,title,published");
  if (cur.error) throw cur.error;
  const rows = (cur.data ?? []) as {
    id: string;
    list: string;
    title: string;
    published: boolean;
  }[];
  // Already applied? (the scorecard's first promise is present and published)
  if (rows.some((r) => r.list === "kept" && r.published && r.title === PROMISES[0]!.title)) return;
  // The old promise tracker and the 2027 agenda are hidden, not deleted, and moved below the
  // scorecard in the CMS list.
  let n = 0;
  for (const r of rows) {
    if (r.list === "kept" && r.title === PROMISES[0]!.title) continue;
    const u = await db
      .from("commitments")
      .update({ published: false, sort_order: 1000 + n++ })
      .eq("id", r.id);
    if (u.error) throw u.error;
  }
  const ins = await db.from("commitments").insert(
    PROMISES.map((p, i) => ({
      list: "kept",
      title: p.title,
      detail: p.detail,
      status: DB_STATUS[p.status],
      status_label: p.status,
      published: true,
      sort_order: (i + 1) * 10,
    })),
  );
  if (ins.error) throw ins.error;
}

// ------------------------------------------------------------------ Settings
async function settings() {
  const home = await readSetting("home");
  const slides = (Array.isArray(home["heroSlides"]) ? home["heroSlides"] : []) as Record<
    string,
    unknown
  >[];
  await writeSetting("home", {
    ...home,
    stats: [
      { n: "11", l: "Local governments" },
      { n: "{projects}", l: "Projects & programmes" },
      { n: "9,000+", l: "Solar streetlights installed" },
      { n: "3,680", l: "Optical outreach beneficiaries" },
    ],
    // The photo with President Tinubu is on the Biography page; not repeated in the carousel.
    heroSlides: slides.filter(
      (s) => !/senator-and-t\.jpg/i.test(fileKey(String(s["url"] ?? s["image"] ?? ""))),
    ),
  });

  const bio = await readSetting("biography");
  await writeSetting("biography", {
    ...bio,
    intro:
      "Senator Dr Yunus Abiodun Akintunde is a Nigerian legislator, author and energy economist representing Oyo Central Senatorial District in the 10th National Assembly. He is from Onikanko Compound, Pakoyi, Oyo town.",
  });

  const contact = await readSetting("contact");
  await writeSetting("contact", {
    ...contact,
    office: "Owode, Oyo town, Oyo State",
    // Not confirmed by the office yet, so not shown.
    hours: "",
    phone: /000\s*0000/.test(String(contact["phone"] ?? "")) ? "" : contact["phone"],
  });

  // "30 days in office" dates from July 2023, not the day it was added to the site.
  const press = await readSetting("press_links");
  const items = (Array.isArray(press["items"]) ? press["items"] : []) as Record<string, unknown>[];
  await writeSetting("press_links", {
    ...press,
    items: items.map((it) =>
      /^30 days in office/i.test(String(it["title"] ?? "")) ? { ...it, date: "2023-07" } : it,
    ),
  });
}

// ------------------------------------------------------------------ Achievement cards
/** The only card photos that show exactly what the item says. Everything else was a stand-in. */
const ACCURATE: [RegExp, RegExp, string][] = [
  [/^Oyo East/i, /borehole/i, "02-borehole-oyo-east.jpg"],
  [/^Ona-?Ara/i, /Aho Parapo/i, "16-aho-parapo-school-block.jpg"],
  [/^Afijio/i, /solar PV/i, "12-naptin-group-photo.jpg"],
  [/^Oyo West/i, /Primary Healthcare Centre/i, "01-phc-isokun.jpg"],
];

async function cards() {
  const { data, error } = await db.from("achievement_cards").select("id,title,items,extra_items");
  if (error) throw error;
  type It = { text: string; image?: string } | string;
  const clean = (title: string, list: It[]) =>
    (list ?? []).map((it) => {
      if (typeof it === "string" || !it.image) return it;
      const keep = ACCURATE.some(
        ([card, item, key]) => card.test(title) && item.test(it.text) && fileKey(it.image!) === key,
      );
      return keep ? it : { ...it, image: "" };
    });
  for (const c of (data ?? []) as { id: string; title: string; items: It[]; extra_items: It[] }[]) {
    const r = await db
      .from("achievement_cards")
      .update({ items: clean(c.title, c.items), extra_items: clean(c.title, c.extra_items) })
      .eq("id", c.id);
    if (r.error) throw r.error;
  }
}

// ------------------------------------------------------------------ Pages: one place per photo
async function pages() {
  await editPage("infrastructure-projects", (secs) => {
    // The two accurate photos now on the achievement cards leave their galleries here
    // (each gallery keeps its other photos of the same project).
    dropFromGallery(
      find(secs, /Solar-powered boreholes/i, (s) => s.lga === "Oyo East"),
      "02-borehole-oyo-east.jpg",
    );
    dropFromGallery(
      find(secs, /Aho Parapo/i, (s) => s.type === "gallery"),
      "16-aho-parapo-school-block.jpg",
    );
    // Tab names from the office's recommended menu.
    const water = "Water & Solar Lighting";
    const markets = "Markets & Electricity";
    for (const s of secs) {
      if (s.tab === "Water & Power")
        s.tab = /Electricity & Transformer/i.test(String(s.heading)) ? markets : water;
      else if (s.tab === "Markets") s.tab = markets;
      else if (s.tab === "Roads & Commissioning") s.tab = "Roads & Infrastructure";
    }
    // Keep each tab's sections together (the moved electricity list joins Markets & Electricity).
    const order = ["Overview", "Education", water, markets, "Roads & Infrastructure"];
    const tabbed = secs.filter((s) => s.tab);
    const rest = secs.filter((s) => !s.tab);
    tabbed.sort((a, b) => order.indexOf(String(a.tab)) - order.indexOf(String(b.tab)));
    return [...tabbed, ...rest];
  });

  await editPage("skills-jobs-and-empowerment", (secs) => {
    dropImage(find(secs, /Training of Youths on Solar PV/i, (s) => s.type === "text"));
    // The ICT centre photos are in the ICT Centres gallery on Infrastructure Projects.
    dropImage(find(secs, /^Establishment of ICT Centres/i));
  });

  await editPage("outreach", (secs) => {
    dropImage(find(secs, /^Healthcare$/i, (s) => s.lga === "Oyo West" && s.type === "list"));
  });

  await editPage("committees-and-oversight", (secs) => {
    dropImage(find(secs, /^Committee Membership/i)); // same Senate chamber photo as Bills & Motions
    dropImage(find(secs, /^Deputy Chairman, Senate Committee on Police Affairs/i)); // on Bills & Motions
    const env = find(secs, /^Environmental Oversight/i);
    if (env && typeof env.body === "string" && !/COP29/.test(env.body))
      env.body = `${env.body}\n\nAs Chairman of the Senate Committee on Environment, he was part of Nigeria’s parliamentary delegation to the 29th United Nations Climate Change Conference (COP29) in Baku, Azerbaijan, in November 2024.`;
  });

  await editPage("political-leadership-and-party-engagement", (secs) => {
    for (const s of secs) {
      if (s.tab === "Constituency Engagements") s.tab = "Party Leadership & Reconciliation";
      if (/^National Party Assignments/i.test(String(s.heading)))
        s.tab = "National Party Assignments";
    }
    // Photos already shown in this page's galleries or on Committees & Oversight.
    dropImage(find(secs, /^Party Reconciliation/i));
    dropImage(find(secs, /^Support for APC Campaigns/i));
    dropImage(find(secs, /^Support for National Political Leadership/i));
    dropImage(find(secs, /^National Party Assignments/i));
    dropImage(find(secs, /^Institutional Oversight/i));
    const climate = find(secs, /^Climate Change Engagement/i);
    const cop29 =
      "He was also part of Nigeria’s parliamentary delegation to the 29th United Nations Climate Change Conference (COP29) in Baku, Azerbaijan, in November 2024, as Chairman of the Senate Committee on Environment.";
    if (climate && typeof climate.body === "string" && !/COP29/.test(climate.body)) {
      const marker = "\n\nThese engagements form part";
      climate.body = climate.body.includes(marker)
        ? climate.body.replace(marker, `\n\n${cop29}${marker}`)
        : `${climate.body}\n\n${cop29}`;
    }
    // National Party Assignments gets its own tab, after Stakeholder Engagements.
    const order = [
      "Party Leadership & Reconciliation",
      "Campaigns & Mobilisation",
      "Stakeholder Engagements",
      "National Party Assignments",
      "Oversight",
    ];
    const tabbed = secs.filter((s) => s.tab);
    const rest = secs.filter((s) => !s.tab);
    tabbed.sort((a, b) => order.indexOf(String(a.tab)) - order.indexOf(String(b.tab)));
    return [...tabbed, ...rest];
  });

  // Recognition: an awards showcase first, then the record in clear categories.
  await editPage(
    "recognition",
    (secs) => {
      const gallery = find(secs, /in pictures/i, (s) => s.type === "gallery");
      dropFromGallery(
        gallery,
        "10-senate-chamber.jpg",
        "13-senate-committee-sitting.jpg",
        "14-senate-office.jpg",
      );
      const leadership = find(secs, /^Public Service/i);
      const card = (title: string, text: string) => ({ title, text, image: "" });
      const list = (heading: string, items: string[]): Sec => ({
        type: "list",
        heading,
        intro: "",
        items,
        style: "bulleted",
        tab: "",
        lga: "",
      });
      return [
        {
          type: "cards",
          heading: "Awards and honours at a glance",
          intro: "",
          tab: "",
          lga: "",
          moreLabel: "See the awards in pictures",
          moreHref: "#recognition-in-pictures",
          items: [
            card(
              "Best-Performing Senator of the Year 2026",
              "Radio Nigeria, Ibadan Zonal Station · 2 November 2026",
            ),
            card(
              "Best Senator of the Year 2025",
              "Nigerian Union of Journalists, Oyo State Council",
            ),
            card(
              "Vice-Chancellor’s Special Meritorious Service Award",
              "Federal University Oye-Ekiti · January 2024",
            ),
            card("University Award of Honour", "University of Uyo · 8 October 2024"),
            card("UI@75 Ambassador", "University of Ibadan · November 2023"),
            card("Honorary Fellowship Award", "School of Surveying, presented at its convocation"),
            card("10th Anniversary Award", "Newspeak & Associates"),
            card(
              "Meritorious Service Award",
              "Nigerian Society of Engineers, Ibadan Branch · 2012",
            ),
            card("COP29 parliamentary delegation", "Baku, Azerbaijan · November 2024"),
            card("Lecture at COP28", "United Nations Climate Change Conference, Dubai"),
            card(
              "Parliamentary Guests’ Programme",
              "Republic of Korea · April 2025, sole Nigerian representative",
            ),
            card("Patron", "National Youth Council of Nigeria, Oyo State Chapter"),
          ],
        },
        list(
          "Public Service and Legislative Leadership",
          (leadership?.items as string[] | undefined) ?? [],
        ),
        list("International Engagements", [
          "Republic of Korea Parliamentary Guests’ Programme, April 2025: Invited by the Government of the Republic of Korea as the sole Nigerian representative in a parliamentary guests’ programme held in Seoul from 20 to 26 April 2025.",
          "Participant, Nigerian Parliamentary Delegation to the 29th United Nations Climate Change Conference (COP29), Baku, Azerbaijan, November 2024: Attended as Chairman of the Senate Committee on Environment.",
          "COP28, Dubai: Part of the Nigerian delegation to the 28th United Nations Climate Change Conference, where he delivered a lecture on the economic implications of climate change for African nations.",
        ]),
        list("Academic Recognition and Lectures", [
          "UI@75 Ambassador, University of Ibadan, November 2023: Recognised as an ambassador during the University of Ibadan’s 75th anniversary.",
          "Vice-Chancellor’s Special Meritorious Service Award, Federal University Oye-Ekiti, January 2024: For contributions relating to environmental management.",
          "Guest Lecturer and University Award of Honour, University of Uyo, 8 October 2024: Second edition of the Prof. Nyaudoh U. Ndaeyo Public Lecture Series.",
          "Guest Lecturer, LAUTECH Alumni Association: Invited to deliver the association’s 17th Annual Lecture.",
          "Honorary Fellowship Award, School of Surveying: Presented at the school’s convocation.",
        ]),
        list("Professional Awards", [
          "Best-Performing Senator of the Year 2026, Radio Nigeria, Ibadan Zonal Station: Conferred on 2 November 2026.",
          "Best Senator of the Year 2025, Nigerian Union of Journalists, Oyo State Council.",
          "10th Anniversary Award, Newspeak & Associates.",
          "Meritorious Service Award, Nigerian Society of Engineers, Ibadan Branch, 2012.",
        ]),
        list("Youth and Community Leadership", [
          "Patron, National Youth Council of Nigeria, Oyo State Chapter.",
          "First President, Centre for Petroleum, Energy Economics and Law Students Association (CPEELSA), University of Ibadan.",
        ]),
        ...(gallery ? [{ ...gallery, heading: "Recognition in pictures" }] : []),
      ];
    },
    {
      intro:
        "Senator Dr Yunus Abiodun Akintunde’s public service, legislative leadership and institutional engagement have been recognised through awards, academic honours and international invitations.",
    },
  );
}

/** A page's header photo is not shown again in any page body (the header keeps it). */
async function heroesOnce() {
  const { data, error } = await db.from("site_pages").select("slug,hero_image,sections");
  if (error) throw error;
  const rows = (data ?? []) as { slug: string; hero_image: string | null; sections: Sec[] }[];
  const heroes = new Set(rows.filter((r) => r.hero_image).map((r) => fileKey(r.hero_image!)));
  for (const r of rows) {
    if (!Array.isArray(r.sections)) continue;
    let changed = false;
    for (const s of r.sections) {
      if (s.images) {
        const kept = s.images.filter((im) => !heroes.has(fileKey(im.url)));
        // A gallery is never emptied; it keeps its photo if the header is its only one.
        if (kept.length && kept.length !== s.images.length) {
          s.images = kept;
          changed = true;
        }
      }
      if (s.image && heroes.has(fileKey(s.image))) {
        s.image = s.image2 ?? "";
        s.caption = (s.caption2 as string | undefined) ?? "";
        if ("image2" in s) {
          s.image2 = "";
          s.caption2 = "";
        }
        changed = true;
      }
      if (s.image2 && heroes.has(fileKey(s.image2))) {
        s.image2 = "";
        s.caption2 = "";
        changed = true;
      }
    }
    if (changed) {
      const u = await db.from("site_pages").update({ sections: r.sections }).eq("slug", r.slug);
      if (u.error) throw u.error;
    }
  }
}

// ------------------------------------------------------------------ Media gallery
async function gallery() {
  const { data, error } = await db.from("gallery_items").select("id,url,category,published");
  if (error) throw error;
  const rows = (data ?? []) as { id: string; url: string; category: string; published: boolean }[];
  // Copies of photos already on the Biography page or uploaded twice.
  const hide = new Set<string>();
  for (const r of rows) {
    const k = fileKey(r.url);
    if (k === "yunus_biography4.jpg" || k === "yunus_biography2.jpg" || k === "senator-and-t.jpg")
      hide.add(r.id);
  }
  const twins = rows.filter((r) =>
    /whatsapp-image-2026-11-25-at-3-22-51-pm-[12]\.jpg$/.test(fileKey(r.url)),
  );
  if (twins.length > 1) for (const r of twins.slice(1)) hide.add(r.id);
  for (const id of hide) {
    const u = await db.from("gallery_items").update({ published: false }).eq("id", id);
    if (u.error) throw u.error;
  }
}

// ------------------------------------------------------------------ Menu
async function menu() {
  const { data, error } = await db
    .from("menu_items")
    .select("id,label,parent_id,page_slug,href,sort_order,visible");
  if (error) throw error;
  type M = {
    id: string;
    label: string;
    parent_id: string | null;
    page_slug: string | null;
    href: string | null;
    sort_order: number;
    visible: boolean;
  };
  const rows = (data ?? []) as M[];
  const upd = async (id: string, patch: Partial<M>) => {
    const r = await db.from("menu_items").update(patch).eq("id", id);
    if (r.error) throw r.error;
  };
  const add = async (
    parent: string,
    label: string,
    href: string | null,
    slug: string | null,
    sort: number,
  ) => {
    if (rows.some((r) => r.parent_id === parent && r.label === label)) return;
    const r = await db.from("menu_items").insert({
      parent_id: parent,
      label,
      href,
      page_slug: slug,
      sort_order: sort,
      visible: true,
    });
    if (r.error) throw r.error;
  };

  const hub = rows.find(
    (r) => r.page_slug === "constituency-interventions-and-development-projects",
  );
  if (hub) {
    const infra = "/infrastructure-projects";
    const skills = "/skills-jobs-and-empowerment";
    const infraRow = rows.find((r) => r.page_slug === "infrastructure-projects");
    if (infraRow) await upd(infraRow.id, { visible: false }); // reached through the four links below
    const outreach = rows.find((r) => r.page_slug === "outreach");
    if (outreach) await upd(outreach.id, { label: "Healthcare & Outreach", sort_order: 20 });
    const sk = rows.find((r) => r.page_slug === "skills-jobs-and-empowerment");
    if (sk) await upd(sk.id, { sort_order: 60 });
    await add(hub.id, "Education", `${infra}#tab-education`, null, 10);
    await add(hub.id, "Roads & Infrastructure", `${infra}#tab-roads-infrastructure`, null, 30);
    await add(hub.id, "Water & Solar Lighting", `${infra}#tab-water-solar-lighting`, null, 40);
    await add(hub.id, "Markets & Electricity", `${infra}#tab-markets-electricity`, null, 50);
    await add(hub.id, "Agriculture", `${skills}#tab-agriculture`, null, 70);
  }

  const pol = rows.find((r) => r.page_slug === "political-leadership-and-party-engagement");
  if (pol) {
    const p = "/political-leadership-and-party-engagement";
    await add(
      pol.id,
      "Party Leadership & Reconciliation",
      `${p}#tab-party-leadership-reconciliation`,
      null,
      10,
    );
    await add(pol.id, "Campaigns & Mobilisation", `${p}#tab-campaigns-mobilisation`, null, 20);
    await add(pol.id, "Stakeholder Engagements", `${p}#tab-stakeholder-engagements`, null, 30);
    await add(
      pol.id,
      "National Party Assignments",
      `${p}#tab-national-party-assignments`,
      null,
      40,
    );
  }

  const news = rows.find((r) => r.label === "News & Media" && !r.parent_id);
  if (news) await add(news.id, "Press Releases", "/news#press-releases", null, 15);
}

export async function applyOfficeFeedback(progress: (msg: string) => void) {
  progress("Setting up the 2023 manifesto scorecard…");
  await scorecard();
  progress("Updating key figures, Biography headline, contact details and press dates…");
  await settings();
  progress("Removing stand-in and repeated photos from the achievement cards…");
  await cards();
  progress("Removing repeated photos from the pages, and reorganising Recognition…");
  await pages();
  await heroesOnce();
  progress("Hiding duplicate photos in the media gallery…");
  await gallery();
  progress("Updating the menu…");
  await menu();
}
