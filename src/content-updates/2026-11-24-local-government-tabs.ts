import { db } from "@/lib/db";
import { hostBundledImages } from "@/lib/bundled-images";
import { LGAS, matchLga, zoneOf } from "@/lib/lgas";

/*
 * Rearranges Infrastructure Projects, Outreach and Skills, Jobs & Empowerment into one tab per
 * local government, adds the new photos, adds local-government tabs to the Constituency page,
 * and regroups the Achievements cards into the three zones with all 11 local governments.
 *
 * It works on the pages as they are now (so earlier CMS edits are kept): items that name a
 * local government move into that local government's tab; everything else stays where it is.
 */

type Sec = {
  type: string;
  heading?: string;
  intro?: string;
  outro?: string;
  body?: string;
  items?: unknown[];
  images?: { url: string; caption: string }[];
  lga?: string;
  [k: string]: unknown;
};

const IMG_INFRA = "/site-images/infrastructure/";
const IMG_SKILLS = "/site-images/skills/";

/** Per local government, sections in a fixed order (keyed by heading). */
class Tabs {
  private map = new Map<string, Map<string, Sec>>();
  add(lga: string, sec: Sec, items: string[] = []) {
    const per = this.map.get(lga) ?? new Map<string, Sec>();
    this.map.set(lga, per);
    const key = sec.heading ?? "";
    const cur = per.get(key);
    if (cur && cur.type === sec.type) {
      if (cur.items) cur.items.push(...items);
      if (cur.images && sec.images) cur.images.push(...sec.images);
      if (sec.outro && !cur.outro) cur.outro = sec.outro;
      return;
    }
    per.set(key, { ...sec, lga, ...(sec.type === "list" ? { items: [...items] } : {}) });
  }
  sections(): Sec[] {
    const out: Sec[] = [];
    for (const l of LGAS) for (const s of this.map.get(l)?.values() ?? []) out.push(s);
    return out;
  }
}

const list = (heading: string, extra: Partial<Sec> = {}): Sec => ({
  type: "list",
  heading,
  intro: "",
  items: [],
  style: "bulleted",
  ...extra,
});
const gallery = (heading: string, images: [string, string][]): Sec => ({
  type: "gallery",
  heading,
  images: images.map(([url, caption]) => ({ url, caption })),
});

const strs = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const findIdx = (secs: Sec[], re: RegExp) =>
  secs.findIndex((s) => !s.lga && re.test(s.heading ?? ""));
const dropLastSentence = (t: string) =>
  t.replace(/\s*(The [^.]*?(include|located in):)\s*$/i, "").trim();

/** "Community High School, Lagbedu, Ogo-Oluwa LGA" → "Community High School, Lagbedu". */
const cleanName = (t: string) =>
  t
    .replace(/\s*\([^)]*\bLGA\)\s*/i, "")
    .replace(/,\s*[^,]*\b(LGA|Local Government( Area)?)\.?\s*$/i, "")
    .trim();

async function loadPage(slug: string): Promise<Sec[] | null> {
  const { data, error } = await db
    .from("site_pages")
    .select("sections")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const s = (data as { sections: unknown }).sections;
  return Array.isArray(s) ? (s as Sec[]) : [];
}

async function savePage(slug: string, sections: Sec[]) {
  const hosted = await hostBundledImages(sections);
  const res = await db.from("site_pages").update({ sections: hosted }).eq("slug", slug);
  if (res.error) throw res.error;
}

/** Keeps the page's own sections, then the tab sections, then the tab heading and records list. */
function assemble(district: Sec[], tabs: Sec[]): Sec[] {
  const hub = district.filter((s) => s.type === "topic" || s.type === "areas");
  const tail = district.filter((s) => s.type === "projects");
  const main = district.filter((s) => !hub.includes(s) && !tail.includes(s));
  return [...main, ...tabs, ...hub, ...tail];
}

// ------------------------------------------------------------------ Infrastructure Projects
async function infrastructure() {
  const secs = await loadPage("infrastructure-projects");
  if (!secs) return;
  const existingTabs = secs.filter((s) => s.lga);
  let district = secs.filter((s) => !s.lga);
  const t = new Tabs();
  const CLASS = "Classroom blocks";

  // Classroom blocks: completed, ongoing, further projects, renovations.
  const iCompleted = findIdx(district, /^Construction of New Classroom Blocks: Completed/i);
  const iOngoing = findIdx(district, /^Construction of New Classroom Blocks: Ongoing/i);
  const iMore = findIdx(district, /^Additional Classroom Projects/i);
  const iReno = findIdx(district, /^Renovation of Existing Classroom Blocks/i);
  const status = (i: number, word: string) => {
    if (i < 0) return;
    for (const it of strs(district[i]!.items)) {
      const l = matchLga(it.split(": ")[0] ?? it);
      if (!l) continue;
      const at = it.indexOf(": ");
      const name = cleanName(at > 0 ? it.slice(0, at) : it);
      const desc = at > 0 ? it.slice(at + 2) : "";
      t.add(l, list(CLASS), [`${name}: ${word}${desc}`]);
    }
  };
  status(iCompleted, "Completed. ");
  status(iOngoing, "Ongoing. ");
  if (iMore >= 0)
    for (const c of (district[iMore]!.items ?? []) as { title?: string; text?: string }[]) {
      const l = matchLga(c.title ?? "");
      if (!l) continue;
      const schools = (c.text ?? "")
        .split("\n")
        .map((x) =>
          x
            .replace(/^[•\-\s]+/, "")
            .replace(/\.\s*$/, "")
            .trim(),
        )
        .filter(Boolean);
      t.add(
        l,
        list(CLASS),
        schools.map((x) => `${x}: Identified for new classroom construction.`),
      );
    }
  if (iReno >= 0)
    for (const it of strs(district[iReno]!.items)) {
      const l = matchLga(it.split(": ")[0] ?? it);
      if (!l) continue;
      const at = it.indexOf(": ");
      t.add(l, list(CLASS), [
        `${cleanName(at > 0 ? it.slice(0, at) : it)}: ${at > 0 ? it.slice(at + 2) : "Renovation of selected classroom blocks."}`,
      ]);
    }
  if (iCompleted >= 0) {
    const paras = [
      district[iCompleted]!.intro,
      iMore >= 0 ? dropLastSentence(String(district[iMore]!.intro ?? "")) : "",
      iReno >= 0 ? dropLastSentence(String(district[iReno]!.intro ?? "")) : "",
      "The schools in each local government, completed, ongoing and planned, are listed under the local government tabs below.",
    ].filter(Boolean);
    const summary: Sec = {
      type: "text",
      heading: "Classroom Projects in Every Local Government",
      body: paras.join("\n\n"),
      image: "",
      caption: "",
      imageSide: "right",
    };
    const drop = new Set([iOngoing, iMore, iReno].filter((i) => i >= 0));
    district = district
      .map((s, i) => (i === iCompleted ? summary : s))
      .filter((_, i) => !drop.has(i));
  }

  // Police and security formations lit with solar.
  const iPolice = findIdx(district, /^Police and Security Formations Covered/i);
  if (iPolice >= 0) {
    for (const c of (district[iPolice]!.items ?? []) as { title?: string; text?: string }[]) {
      const l = matchLga(c.title ?? "");
      if (!l) continue;
      const lines = (c.text ?? "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
      const note = lines.filter((x) => /^\(.*\)$/.test(x)).map((x) => x.slice(1, -1));
      const items = lines.filter((x) => !/^\(.*\)$/.test(x)).map((x) => x.replace(/^[•\-\s]+/, ""));
      t.add(
        l,
        list("Solar lighting at police and security formations", note[0] ? { outro: note[0] } : {}),
        items,
      );
    }
    district.splice(iPolice, 1);
    const iLight = findIdx(district, /^Light Up Oyo Central/i);
    if (iLight >= 0)
      district[iLight] = {
        ...district[iLight]!,
        items: strs(district[iLight]!.items).map((x) =>
          x.replace(/listed below\.?$/i, "listed under each local government's tab below."),
        ),
      };
  }

  // Markets.
  const iMarket = findIdx(district, /^Market Development/i);
  if (iMarket >= 0) {
    const m = district[iMarket]!;
    const rest: string[] = [];
    for (const it of strs(m.items)) {
      const l = matchLga(it);
      const name = it.split(":")[0]!.trim();
      if (l)
        t.add(l, list("Market development"), [
          `${name}: Market facility with solar-powered lighting.`,
        ]);
      else rest.push(it);
    }
    district[iMarket] = rest.length
      ? { ...m, items: rest }
      : {
          type: "text",
          heading: m.heading ?? "Market Development",
          body: [
            dropLastSentence(String(m.intro ?? "")),
            "The markets are listed under each local government's tab below.",
            m.outro,
          ]
            .filter(Boolean)
            .join("\n\n"),
          image: "",
          caption: "",
          imageSide: "right",
        };
  }

  // Electricity: items naming a local government (e.g. Akinyele Cattle Market) move to its tab.
  const iPower = findIdx(district, /^Electricity & Transformer/i);
  if (iPower >= 0) {
    const p = district[iPower]!;
    const rest: string[] = [];
    for (const it of strs(p.items)) {
      const l = matchLga(it);
      if (l) t.add(l, list("Electricity"), [it]);
      else rest.push(it);
    }
    district[iPower] = { ...p, items: rest };
  }

  // New photos, by the local government shown on them.
  t.add(
    "Oyo West",
    gallery("Solar-powered boreholes", [
      [`${IMG_INFRA}01-borehole-oyo-west.jpg`, "Solar-powered boreholes in Oyo West."],
    ]),
  );
  t.add(
    "Oyo East",
    gallery("Solar-powered boreholes", [
      [`${IMG_INFRA}02-borehole-oyo-east.jpg`, "Solar-powered boreholes in Oyo East."],
      [`${IMG_INFRA}03-borehole-oyo-east-2.jpg`, "Solar-powered boreholes in Oyo East."],
    ]),
  );
  t.add(
    "Atiba",
    gallery("Classroom block at Oranyan Grammar School, Sabo", [
      [
        `${IMG_INFRA}04-classroom-oranyan-grammar-school.jpg`,
        "A block of two classrooms with an office and furniture at Oranyan Grammar School, Sabo, Atiba LGA, built with the Universal Basic Education Commission.",
      ],
    ]),
  );
  const extraHeading = "Roads, Water and Classrooms Across the District";
  district = district.filter((s) => s.heading !== extraHeading);
  const iTopic = district.findIndex((s) => s.type === "topic" || s.type === "projects");
  district.splice(
    iTopic >= 0 ? iTopic : district.length,
    0,
    gallery(extraHeading, [
      [`${IMG_INFRA}07-asphalted-road.jpg`, "A newly asphalted road."],
      [`${IMG_INFRA}08-asphalted-road-2.jpg`, "A newly asphalted road."],
      [`${IMG_INFRA}05-solar-borehole-collage.jpg`, "Solar-powered boreholes."],
      [
        `${IMG_INFRA}06-classroom-block-commissioning.jpg`,
        "A new classroom block ready for commissioning.",
      ],
    ]),
  );

  // Gather any sections already in a tab (re-running is safe), then the new ones.
  const tabs = [...existingTabs, ...t.sections()];
  const seen = new Set<string>();
  const merged = tabs.filter((s) => {
    const k = `${s.lga}|${s.type}|${s.heading}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // Name the tabs after the page's existing "by local government" section.
  for (const s of district)
    if (s.type === "topic" && /by local government/i.test(String(s.heading)))
      s.heading = "Infrastructure in Each Local Government";
  // The "Delivered projects" list repeats the old sample projects from Record & Agenda (one is
  // outside Oyo Central), so it comes off this page. The projects stay in Record & Agenda.
  await savePage(
    "infrastructure-projects",
    assemble(
      district.filter((s) => s.type !== "projects"),
      merged,
    ),
  );
}

// ------------------------------------------------------------------ Outreach
async function outreach() {
  const secs = await loadPage("outreach");
  if (!secs) return;
  const existingTabs = secs.filter((s) => s.lga);
  const district = secs.filter((s) => !s.lga);
  const t = new Tabs();
  const iHealth = findIdx(district, /^Healthcare Facilities/i);
  if (iHealth >= 0) {
    const h = district[iHealth]!;
    const rest: string[] = [];
    for (const it of strs(h.items)) {
      // Only items about one named local government (not "across the 11 LGAs").
      const l = /11 LGAs|all 11/i.test(it) ? null : matchLga(it);
      if (l) t.add(l, list("Healthcare", { style: "numbered" }), [it]);
      else rest.push(it);
    }
    district[iHealth] = { ...h, items: rest };
  }
  for (const s of district)
    if (s.type === "topic" && /every local government/i.test(String(s.heading)))
      s.heading = "Outreach in Each Local Government";
  await savePage("outreach", assemble(district, [...existingTabs, ...t.sections()]));
}

// ------------------------------------------------------------------ Skills, Jobs & Empowerment
async function skills() {
  const secs = await loadPage("skills-jobs-and-empowerment");
  if (!secs) return;
  const DIGITAL = "Digital Skills for Artisans";
  const MARKETING = "Digital Marketing Skills for Renewed Hope Employment & Wealth Creation";
  const SOLAR = "Training of Youths on Solar PV & Entrepreneurship";
  const keep = secs.filter((s) => ![DIGITAL, MARKETING, SOLAR].includes(String(s.heading)));
  const existingTabs = keep.filter((s) => s.lga);
  const district = keep.filter((s) => !s.lga);
  const iTopic = district.findIndex((s) => s.type === "topic");
  district.splice(
    iTopic >= 0 ? iTopic : district.length,
    0,
    gallery(DIGITAL, [
      [
        `${IMG_SKILLS}01-laptops-for-artisans.jpg`,
        "Laptops ready for the participants of the Digital Skills for Artisans programme.",
      ],
      [`${IMG_SKILLS}02-laptop-presentation.jpg`, "A participant receives a laptop."],
      [
        `${IMG_SKILLS}03-digital-skills-backpacks.jpg`,
        "Digital Skills for Artisans backpacks for the participants.",
      ],
      [
        `${IMG_SKILLS}04-digital-skills-dignitaries.jpg`,
        "Guests at the Digital Skills for Artisans programme with NITDA.",
      ],
      [
        `${IMG_SKILLS}05-digital-skills-participants.jpg`,
        "Participants at the Digital Skills for Artisans programme.",
      ],
      [`${IMG_SKILLS}06-digital-skills-graduates.jpg`, "Participants with their new laptops."],
    ]),
    gallery(MARKETING, [
      [
        `${IMG_SKILLS}07-digital-marketing-skills.jpg`,
        "Participants with their laptops at the NITDA Digital Marketing Skills programme.",
      ],
    ]),
  );
  const solar: Sec[] = [
    {
      type: "text",
      lga: "Afijio",
      heading: SOLAR,
      body: "Young people were trained in solar PV installation and entrepreneurship at a programme facilitated by Senator Akintunde with the National Power Training Institute of Nigeria (NAPTIN), in collaboration with Ritnon Resources Concept Nig Ltd.\n\nThe training held on 22 September 2025 at Pa Samuel Akinola Akinjobi Memorial Hall, Akinmoorin-Awe Road, Akinmoorin.",
      image: `${IMG_SKILLS}12-naptin-group-photo.jpg`,
      caption: "Participants at the NAPTIN solar PV and entrepreneurship training, Akinmoorin.",
      imageSide: "right",
    },
    {
      ...gallery("Solar PV training in pictures", [
        [`${IMG_SKILLS}09-naptin-training-hall.jpg`, "The training hall at Akinmoorin."],
        [`${IMG_SKILLS}08-naptin-training.jpg`, "Participants at the training."],
        [`${IMG_SKILLS}11-naptin-group-work.jpg`, "Participants working in groups."],
        [`${IMG_SKILLS}10-naptin-safety-kit.jpg`, "A participant receives safety equipment."],
      ]),
      lga: "Afijio",
    },
  ];
  const tabs = [
    ...existingTabs.filter((s) => s.heading !== "Solar PV training in pictures"),
    ...solar,
  ];
  for (const s of district)
    if (s.type === "topic" && /by local government/i.test(String(s.heading)))
      s.heading = "Empowerment in Each Local Government";
  await savePage("skills-jobs-and-empowerment", assemble(district, tabs));
}

// ------------------------------------------------------------------ Constituency page
async function constituency() {
  const slug = "constituency-interventions-and-development-projects";
  const secs = await loadPage(slug);
  if (!secs || secs.some((s) => s.type === "areas")) return;
  await savePage(slug, [
    ...secs,
    {
      type: "areas",
      heading: "Projects in Each Local Government",
      intro:
        "Pick a local government to see the infrastructure, outreach and empowerment projects delivered there.",
    },
  ]);
}

// ------------------------------------------------------------------ Achievements cards
const NEW_CARDS: Record<string, { text: string; image?: string }[]> = {
  Afijio: [
    {
      text: "Three blocks of six classrooms each, with toilet facilities, at Ilu-Aje Community High School (ongoing)",
    },
    { text: "Renovation of classroom blocks at Baptist Secondary School, Oke-Isanmi, Ilora" },
    { text: "Iware Market, with solar-powered lighting" },
    {
      text: "Solar lighting scheduled for the Awe, Jobele, Ilora and Fiditi police divisional headquarters",
    },
    {
      text: "Training of youths on solar PV and entrepreneurship with NAPTIN at Akinmoorin, September 2025",
      image: `${IMG_SKILLS}12-naptin-group-photo.jpg`,
    },
  ],
  Atiba: [
    {
      text: "A block of two classrooms with an office and furniture at Oranyan Grammar School, Sabo",
      image: `${IMG_INFRA}04-classroom-oranyan-grammar-school.jpg`,
    },
    {
      text: "Two blocks of six classrooms, a 500-capacity multipurpose hall and an e-library at Oranyan Grammar School (ongoing)",
    },
    { text: "Solar lighting scheduled for the Atiba police divisional headquarters" },
  ],
  "Oyo East": [
    {
      text: "A block of two classrooms with an office and furniture at L.A. Primary School, Jabata",
    },
    {
      text: "Renovation of classroom blocks at Durbar Grammar School and Ansarudeen Primary School, Oke Balogun",
    },
    { text: "Araromi Market, with solar-powered lighting" },
    { text: "Solar lighting at Durbar Police Station and the Passport Office" },
    { text: "Solar-powered boreholes", image: `${IMG_INFRA}02-borehole-oyo-east.jpg` },
  ],
  "Oyo West": [
    { text: "A block of two classrooms with an office and furniture at ADS Grammar School, Opapa" },
    { text: "Renovation of classroom blocks at Ansarudeen Primary School, Alagbon" },
    { text: "Irepo Market, with solar-powered lighting" },
    { text: "Construction and renovation of a Primary Healthcare Centre" },
    { text: "Solar-powered boreholes", image: `${IMG_INFRA}01-borehole-oyo-west.jpg` },
  ],
};

async function achievements() {
  const { data, error } = await db.from("achievement_cards").select("id,title,zone");
  if (error) throw error;
  const rows = (data ?? []) as { id: string; title: string; zone: string }[];
  const have = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const l = r.zone.toLowerCase() === "senate" ? null : matchLga(r.title);
    if (l) have.set(l, r);
  }
  // Zones and order: Ibadan, Oyo, Ogbomoso, then the Senate card.
  for (const [i, l] of LGAS.entries()) {
    const r = have.get(l);
    if (r) {
      const res = await db
        .from("achievement_cards")
        .update({ zone: zoneOf(l), sort_order: i * 10 })
        .eq("id", r.id);
      if (res.error) throw res.error;
    } else if (NEW_CARDS[l]) {
      const items = await hostBundledImages(
        NEW_CARDS[l]!.map((x) => ({ text: x.text, image: x.image ?? "" })),
      );
      const res = await db.from("achievement_cards").insert({
        title: `${l} Local Government`,
        zone: zoneOf(l),
        heading: `${items.length} major achievements`,
        items,
        extra_heading: "",
        extra_items: [],
        sort_order: i * 10,
        published: true,
      });
      if (res.error) throw res.error;
    }
  }
  const senate = await db
    .from("achievement_cards")
    .update({ sort_order: 1000 })
    .eq("zone", "Senate");
  if (senate.error) throw senate.error;
}

export async function applyLocalGovernmentTabs(progress: (msg: string) => void) {
  progress("Arranging Infrastructure Projects by local government…");
  await infrastructure();
  progress("Arranging Outreach…");
  await outreach();
  progress("Adding the Skills, Jobs & Empowerment photos…");
  await skills();
  progress("Adding local government tabs to the Constituency page…");
  await constituency();
  progress("Regrouping Achievements into the three zones…");
  await achievements();
}
