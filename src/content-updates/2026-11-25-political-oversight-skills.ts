import { db } from "@/lib/db";
import { hostBundledImages } from "@/lib/bundled-images";

/*
 * - Skills, Jobs & Empowerment: the full content in five topic tabs (Jobs & Human Capital,
 *   Skills & Empowerment, Grants & Women's Support, Agriculture, ICT Centres), with anything
 *   about one local government moved into that local government's tab. Job beneficiaries' photos.
 * - New pages: Political Leadership & Party Engagement (with its menu pages as tabs),
 *   Constituency Engagements, Campaigns & Mobilisation, Stakeholder Engagements, and Oversight.
 * - Photos: Aho Parapo (Ona Ara), Isokun PHC (Oyo West), classroom and project commissioning.
 */

type Sec = Record<string, unknown> & {
  type: string;
  heading?: string;
  lga?: string;
  tab?: string;
  image?: unknown;
  caption?: unknown;
  body?: unknown;
  items?: unknown[];
  images?: { url: string; caption: string }[];
};

const P = "/site-images/political/";
const I = "/site-images/infrastructure/";
const O = "/site-images/outreach/";
const OV = "/site-images/oversight/";
const S = "/site-images/skills/";

const text = (heading: string, body: string, extra: Partial<Sec> = {}): Sec => ({
  type: "text",
  heading,
  body,
  image: "",
  caption: "",
  imageSide: "right",
  ...extra,
});
const list = (heading: string, intro: string, items: string[], extra: Partial<Sec> = {}): Sec => ({
  type: "list",
  heading,
  intro,
  items,
  style: "numbered",
  outro: "",
  ...extra,
});
const gallery = (heading: string, imgs: [string, string][], extra: Partial<Sec> = {}): Sec => ({
  type: "gallery",
  heading,
  images: imgs.map(([url, caption]) => ({ url, caption })),
  ...extra,
});

async function loadSections(slug: string): Promise<Sec[] | null> {
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
async function saveSections(slug: string, sections: Sec[]) {
  const res = await db
    .from("site_pages")
    .update({ sections: await hostBundledImages(sections) })
    .eq("slug", slug);
  if (res.error) throw res.error;
}
async function upsertPage(
  slug: string,
  seed: {
    title: string;
    eyebrow: string;
    intro: string;
    hero_image: string;
    hero_alt: string;
    seo_description: string;
    sections: Sec[];
  },
) {
  const row = { ...(await hostBundledImages(seed)), status: "published" };
  const existing = await db.from("site_pages").select("id").eq("slug", slug).maybeSingle();
  if (existing.error) throw existing.error;
  const res = existing.data
    ? await db.from("site_pages").update(row).eq("slug", slug)
    : await db.from("site_pages").insert({ ...row, slug });
  if (res.error) throw res.error;
}

/** A photo already on the site (found by file name), so it isn't uploaded twice. */
async function sitePhoto(file: string): Promise<string> {
  const { data } = await db.from("site_pages").select("sections");
  for (const p of (data ?? []) as { sections: Sec[] }[])
    for (const s of p.sections ?? []) {
      for (const im of s.images ?? []) if (im.url.includes(file)) return im.url;
      if (typeof s.image === "string" && s.image.includes(file)) return s.image;
    }
  return "";
}

// ------------------------------------------------------------------ Skills, Jobs & Empowerment
const JOBS = "Jobs & Human Capital";
const SKILLS = "Skills & Empowerment";
const GRANTS = "Grants & Women's Support";
const AGRIC = "Agriculture";
const ICT = "ICT Centres";

function skillsTabs(): Sec[] {
  return [
    text(
      "Human Capital Development, Youth Advancement & Employment",
      "People remain the foundation of sustainable development. Senator Dr Yunus Abiodun Akintunde recognises that meaningful representation must create opportunities for individuals and communities to grow, participate in governance, and achieve economic independence.\n\nHis human capital development initiatives focus on grassroots engagement, vocational training, youth advancement, access to employment opportunities, and institutional representation across Oyo Central Senatorial District.",
      { tab: JOBS },
    ),
    text(
      "Grassroots Engagement & Constituency Representation",
      "To strengthen communication and maintain effective engagement with constituents, Senator Akintunde appointed 42 aides across the district to serve as liaison officers and special assistants.\n\nThe appointments are designed to promote grassroots participation, improve communication between communities and the Senator's office, identify local needs, and ensure inclusive representation across the 11 local government areas.",
      { tab: JOBS },
    ),
    list(
      "Youth Employment & Federal Government Opportunities",
      "Senator Akintunde has facilitated access to over 50 gainful employment opportunities in federal government institutions for qualified youths from the constituency. Beneficiaries have secured opportunities in the following institutions:",
      [
        "National Biosafety Management Agency: 2 staff.",
        "Transmission Company of Nigeria (TCN): 6 staff.",
        "Nigeria Police Force: 25 staff.",
        "National Park Service: 3 staff.",
        "National Bureau of Statistics",
        "Nigeria Revenue Service (formerly Federal Inland Revenue Service): 26 staff.",
        "Federal School of Surveying, Oyo: 2 staff.",
        "Federal College of Education (Special), Oyo: 2 staff.",
        "Police Service Commission: 1 staff.",
        "Federal Polytechnic, Ayede: 5 staff.",
        "YABATECH: 1 staff.",
      ],
      {
        tab: JOBS,
        style: "bulleted",
        outro:
          "These opportunities reflect his commitment to supporting qualified young people in accessing employment and building careers within federal institutions.",
      },
    ),
    gallery(
      "Job Beneficiaries",
      [
        [
          `${S}13-job-yekinni-lawal-adedeji.jpg#shape=portrait`,
          "Yekinni Lawal Adedeji, National Bureau of Statistics",
        ],
        [
          `${S}14-job-halid-adeniyi-akee.jpg#shape=portrait`,
          "Halid Adeniyi-Akee, Nigeria Revenue Service",
        ],
        [
          `${S}15-job-biliaminu-sheriff.jpg#shape=portrait`,
          "Biliaminu Sheriff (FCA, FCTI, ACCA Dip IFRS, ACCA Data Analysis), Nigeria Revenue Service",
        ],
        [
          `${S}16-job-hameed-mustapha-ramadan.jpg#shape=portrait`,
          "Hameed Mustapha Ramadan, Nigeria Revenue Service",
        ],
        [
          `${S}17-job-ibikunle-oyewale-titus.jpg#shape=portrait`,
          "Ibikunle Oyewale Titus, National Biosafety Management Agency (NBMA)",
        ],
      ],
      { tab: JOBS },
    ),
    text(
      "Access to Higher Education & Security Institutions",
      "Beyond employment facilitation, Senator Akintunde has also supported constituents seeking admission into specialised national institutions.\n\nThis includes facilitating the admission of constituents into the Nigeria Police Academy, Wudil, Kano State, and providing opportunities for young people interested in professional training and careers in the Nigeria Police Force.",
      { tab: JOBS },
    ),

    text(
      "Empowerment, Skills Acquisition & Economic Development",
      "Senator Dr Yunus Abiodun Akintunde considers economic empowerment and skills development essential to sustainable community growth. Through targeted interventions, he has supported traders, artisans, women, youths and small-scale entrepreneurs with vocational training, business grants, equipment and financial assistance.\n\nThese initiatives are designed to promote self-reliance, strengthen livelihoods, encourage entrepreneurship and create opportunities for economic advancement across Oyo Central Senatorial District.",
      { tab: SKILLS },
    ),
    list(
      "Skills Acquisition & Vocational Empowerment",
      "To equip constituents with practical skills and resources for employment and self-employment, Senator Akintunde has facilitated the following programmes:",
      [
        "Tailoring: Training and empowerment of 465 beneficiaries with sewing machines and honoraria.",
        "ICT Training: Training and empowerment of 439 participants with Android tablet phones and honoraria.",
        "Mobile Phone Repairs: Training and empowerment of 316 youths with phone repair toolboxes and honoraria.",
        "Women's Economic Empowerment: Distribution of 250 grinding mill machines to women.",
        "Mechanics' Empowerment: Provision of complete toolboxes to 100 mechanic technicians.",
        "Welders' Empowerment: Provision of toolboxes and welding machines to 100 welders.",
        "Digital Skills for Artisans: Provision of laptop computers and honoraria to 55 beneficiaries.",
      ],
      { tab: SKILLS },
    ),
    list(
      "Skills Acquisition & Vocational Development",
      "Senator Akintunde has facilitated skills acquisition and vocational training programmes to equip beneficiaries with practical knowledge and tools for self-reliance. The initiatives include:",
      [
        "Women's Empowerment Training: Training facilitated for women under the auspices of the Federal Ministry of Women Affairs, UN Women Department, and the Ford Foundation.",
        "GSM Repairs Training: Vocational training in mobile phone repairs facilitated for selected rural cooperators, providing participants with practical skills and opportunities for self-employment.",
      ],
      {
        tab: SKILLS,
        outro:
          "These programmes are aimed at strengthening livelihoods, promoting entrepreneurship and expanding economic opportunities for beneficiaries.",
      },
    ),

    list(
      "Traders' Support & Financial Grants",
      "Senator Akintunde has facilitated financial support initiatives aimed at strengthening market activities and improving the economic capacity of traders and artisans. The interventions include:",
      [
        "Conditional Cash Transfer: ₦50,000 each to 500 beneficiaries.",
        "Oyo Central Traders' Support: A total cash grant of ₦25,000,000 for market men and women across the 11 local government areas.",
      ],
      {
        tab: GRANTS,
        outro:
          "Support for traders and artisans in Akinyele, including Ojoo Market, is listed under the Akinyele tab below.",
      },
    ),
    list(
      "Women Empowerment & Clean Cooking Initiative",
      "As part of his commitment to women's advancement and improved household welfare, Senator Akintunde has supported initiatives that provide women with economic opportunities and access to practical resources. These include:",
      [
        "Sponsorship of four women to participate in a United Nations (UN) Women training programme.",
        "Distribution of 3,500 eco-friendly clean cooking stoves to beneficiaries across Oyo Central Senatorial District.",
      ],
      {
        tab: GRANTS,
        style: "bulleted",
        outro:
          "The initiatives are intended to support women's development, improve household livelihoods and encourage the adoption of cleaner cooking alternatives.",
      },
    ),

    text(
      "Agricultural Support & Farmers' Empowerment",
      "Recognising agriculture as a major source of livelihood and an important contributor to food security, Senator Akintunde has facilitated the distribution of agricultural inputs and protective equipment to support farmers across Oyo Central Senatorial District.",
      { tab: AGRIC },
    ),
    list(
      "Fertilisers & Farm Chemicals",
      "",
      [
        "Distribution of 7,200 units of NPK fertiliser.",
        "Distribution of herbicides and pesticides.",
      ],
      {
        tab: AGRIC,
        style: "bulleted",
      },
    ),
    list(
      "Agricultural Equipment & Protective Materials",
      "",
      [
        "Distribution of 2,000 knapsack sprayers.",
        "Distribution of 300 pairs of rain boots.",
        "Distribution of 300 pairs of rubber gloves.",
      ],
      { tab: AGRIC, style: "bulleted" },
    ),
    list(
      "Improved Seeds & Planting Materials",
      "",
      [
        "Distribution of 500 bags of yam seeds.",
        "Distribution of 300 bags of hybrid maize seeds.",
        "Distribution of 2,000 packets of hybrid tomato seeds.",
      ],
      {
        tab: AGRIC,
        style: "bulleted",
        outro:
          "These agricultural interventions are aimed at supporting farmers with essential inputs, improving farming activities and strengthening agricultural productivity across the district.",
      },
    ),

    text(
      "Establishment of ICT Centres",
      "As part of his commitment to educational development and digital inclusion, Senator Dr Yunus Abiodun Akintunde has facilitated the establishment of four ICT centres in selected secondary schools across Oyo Central Senatorial District.\n\nThe centres are intended to improve access to digital learning resources, strengthen computer literacy and equip students with essential technological skills. They are in Akinyele, Oyo West, Surulere and Ogo Oluwa; each is listed under its local government's tab below.\n\nThrough these interventions, Senator Akintunde continues to support access to digital education and prepare young people for opportunities in an increasingly technology-driven world.",
      {
        tab: ICT,
        image: "/site-images/education/02-ict-centre-computers.jpg",
        caption: "Computers in a newly equipped ICT centre.",
      },
    ),
  ];
}

const LGA_ITEMS: [string, Sec][] = [
  [
    "Akinyele",
    list("Traders' support", "", [
      "Ojoo Market Traders' Support: Support for 40 market men and women.",
      "Akinyele LGA Traders and Artisans Support: A cash grant of ₦7,000,000 to support traders and artisans across the local government area, including beneficiaries at Ojoo Market.",
    ]),
  ],
  ["Akinyele", list("ICT centre", "", ["Ojoo Secondary School, Ibadan"], { style: "bulleted" })],
  [
    "Oyo West",
    list("ICT centre", "", ["Army Children Secondary School, Ojongbodu, Oyo"], {
      style: "bulleted",
    }),
  ],
  ["Surulere", list("ICT centre", "", ["Baptist Secondary Grammar School"], { style: "bulleted" })],
  [
    "Ogo Oluwa",
    list("ICT centre", "", ["Lagbedu Community High School, Lagbedu, Ogbomoso"], {
      style: "bulleted",
    }),
  ],
];

async function skills() {
  const slug = "skills-jobs-and-empowerment";
  const secs = await loadSections(slug);
  if (!secs) return;
  const add = skillsTabs();
  const lgaAdd = LGA_ITEMS.map(([lga, s]) => ({ ...s, lga }));
  const newKeys = new Set([...add, ...lgaAdd].map((s) => `${s.lga ?? ""}|${s.heading}`));
  // The old overview list and its closing line are replaced by the full content.
  const keep = secs.filter(
    (s, i) =>
      !newKeys.has(`${s.lga ?? ""}|${s.heading}`) &&
      !(i < 2 && /^Skills Acquisition, Jobs & Empowerment$/i.test(String(s.heading ?? ""))) &&
      !(
        i < 2 &&
        s.type === "text" &&
        !s.heading &&
        /strengthen livelihoods/i.test(String(s.body ?? ""))
      ),
  );
  // Existing digital-skills photo sections go into the Skills & Empowerment tab.
  for (const s of keep)
    if (!s.lga && s.type === "gallery" && /Digital (Skills|Marketing)/i.test(String(s.heading)))
      s.tab = SKILLS;
  const tabbed = keep.filter((s) => s.tab);
  const rest = keep.filter((s) => !s.tab);
  // Order: topic tabs first (photos after their tab's text), then local government content.
  const order = [JOBS, SKILLS, GRANTS, AGRIC, ICT];
  const all = [...add, ...tabbed].sort((a, b) => order.indexOf(a.tab!) - order.indexOf(b.tab!));
  const firstLga = rest.findIndex((s) => s.lga || s.type === "topic");
  const next = [
    ...rest.slice(0, firstLga < 0 ? rest.length : firstLga),
    ...all,
    ...lgaAdd,
    ...(firstLga < 0 ? [] : rest.slice(firstLga)),
  ];
  await saveSections(slug, next);
}

// ------------------------------------------------------------------ Infrastructure & Outreach
async function infrastructure() {
  const slug = "infrastructure-projects";
  const secs = await loadSections(slug);
  if (!secs) return;
  const AHO = "Rehabilitation of Aho Parapo Community Secondary School";
  const CLASS = "Commissioning of New Classrooms";
  const COMM = "Project Commissioning";
  const out = secs.filter((s) => ![AHO, CLASS, COMM].includes(String(s.heading)));
  for (const s of out)
    if (s.lga === "Ona Ara" && s.heading === "Classroom blocks" && Array.isArray(s.items)) {
      const line =
        "Aho Parapo Community Secondary School, Amuloko: Rehabilitation in 2025 under the National Productivity Centre's rehabilitation of selected schools in Oyo Central.";
      if (!s.items.includes(line)) s.items = [line, ...s.items];
    }
  const aho = gallery(
    AHO,
    [
      [
        `${I}16-aho-parapo-school-block.jpg`,
        "The rehabilitated classroom block at Aho Parapo Community Secondary School.",
      ],
      [
        `${I}17-aho-parapo-signboard.jpg#shape=portrait`,
        "Project signboard: Rehabilitation of some selected schools in Oyo Central Senatorial District, Aho Parapo Community Secondary School, Ibadan (2025).",
      ],
      [`${I}18-aho-parapo-school-block-2.jpg`, "Another view of the rehabilitated block."],
    ],
    { lga: "Ona Ara" },
  );
  const classrooms = gallery(CLASS, [
    [
      `${I}09-classroom-commissioning-visit.jpg`,
      "Senator Akintunde with pupils at the commissioning of new classrooms.",
    ],
    [`${I}10-classroom-commissioning-pupils.jpg`, "Pupils in one of the new classrooms."],
    [`${I}11-new-classroom-furniture.jpg`, "A new classroom furnished with desks and benches."],
    [
      `${I}12-classroom-commissioning-walkthrough.jpg`,
      "Touring the new classrooms with pupils and guests.",
    ],
    [`${I}13-pupils-in-new-classroom.jpg`, "Pupils in their new classroom."],
  ]);
  const comm = gallery(COMM, [
    [`${I}14-commissioning-ribbon.jpg`, "Cutting the ribbon at a project commissioning."],
    [`${I}15-commissioning-ribbon-2.jpg`, "Community leaders at the commissioning."],
  ]);
  const firstTab = out.findIndex((s) => s.lga || s.type === "topic");
  const at = firstTab < 0 ? out.length : firstTab;
  await saveSections(slug, [...out.slice(0, at), classrooms, comm, ...out.slice(at), aho]);
}

async function outreach() {
  const slug = "outreach";
  const secs = await loadSections(slug);
  if (!secs) return;
  const PHC = "Primary Healthcare Centre, Isokun";
  const banner =
    "Construction of a 20-bed PHC and renovation of the existing PHC at Isokun, Oyo West Local Government.";
  const out = secs.filter((s) => s.heading !== PHC);
  for (const s of out)
    if (s.lga === "Oyo West" && s.heading === "Healthcare") {
      s.image = `${O}01-phc-isokun.jpg`;
      s.caption = banner;
    }
  out.push(gallery(PHC, [[`${O}02-phc-isokun-street.jpg`, banner]], { lga: "Oyo West" }));
  await saveSections(slug, out);
}

// ------------------------------------------------------------------ Achievements cards
async function cards() {
  const { data, error } = await db.from("achievement_cards").select("id,title,items,extra_items");
  if (error) throw error;
  const set = async (id: string, patch: Record<string, unknown>) => {
    const res = await db
      .from("achievement_cards")
      .update(await hostBundledImages(patch))
      .eq("id", id);
    if (res.error) throw res.error;
  };
  for (const c of (data ?? []) as {
    id: string;
    title: string;
    items: { text: string; image: string }[];
    extra_items: { text: string; image: string }[];
  }[]) {
    if (/Oyo West/i.test(c.title))
      await set(c.id, {
        items: c.items.map((it) =>
          /Primary Healthcare/i.test(it.text) ? { ...it, image: `${O}01-phc-isokun.jpg` } : it,
        ),
      });
    if (/Ona[- ]Ara/i.test(c.title))
      await set(c.id, {
        extra_items: (c.extra_items ?? []).map((it) =>
          /Aho Parapo/i.test(it.text) ? { ...it, image: `${I}16-aho-parapo-school-block.jpg` } : it,
        ),
      });
  }
}

// ------------------------------------------------------------------ Political & Oversight pages
const POL = "political-leadership-and-party-engagement";
const OVS = "oversight-and-institutional-engagement";

async function politicalPages() {
  await upsertPage(POL, {
    title: "Political Leadership & Party Engagement",
    eyebrow: "Political & Party Leadership",
    intro:
      "Beyond his legislative responsibilities, Senator Dr Yunus Abiodun Akintunde has remained actively involved in strengthening the All Progressives Congress (APC) at the state and national levels.\n\nHis political engagements include party organisation, reconciliation, electoral mobilisation, support for party candidates, and participation in strategic political assignments.",
    hero_image: `${P}01-press-interview.jpg`,
    hero_alt: "Senator Akintunde speaking to the press.",
    seo_description:
      "Senator Yunus Akintunde's work strengthening the APC in Oyo State and nationally: reconciliation, mobilisation, stakeholder engagement and party assignments.",
    sections: [{ type: "subpages", heading: "", intro: "" }],
  });
  await upsertPage("constituency-engagements", {
    title: "Constituency Engagements",
    eyebrow: "Political & Party Leadership",
    intro: "",
    hero_image: "",
    hero_alt: "",
    seo_description:
      "Senator Akintunde's party reconciliation, organisational support and constituency engagement for the APC in Oyo State.",
    sections: [
      text(
        "Party Reconciliation & Organisational Support",
        "Senator Akintunde has participated in reconciliation efforts aimed at strengthening unity and repositioning the APC in Oyo State.\n\nHe has also provided leadership, strategic support and financial contributions towards party activities, meetings, organisation and mobilisation.\n\nHis involvement has included support for the party and its candidates during important electoral engagements, including the 2024 local government elections and the 2025 Ibadan North Federal Constituency bye-election.",
      ),
    ],
  });
  await upsertPage("campaigns-and-mobilisation", {
    title: "Campaigns & Mobilisation",
    eyebrow: "Political & Party Leadership",
    intro: "",
    hero_image: "",
    hero_alt: "",
    seo_description:
      "Senator Akintunde's support for APC campaigns, support groups and grassroots mobilisation across Oyo State.",
    sections: [
      text(
        "Support for APC Campaigns & Grassroots Mobilisation",
        "As part of his contribution to party mobilisation, Senator Akintunde supported APC support groups and the City Boy Movement with five Sienna campaign buses to strengthen their grassroots activities and mobilisation efforts.\n\nHe also supported and participated in the Renewed Hope Ambassador Sensitisation Rallies across Oyo State, contributing to efforts aimed at promoting the Renewed Hope Agenda and strengthening grassroots engagement.",
      ),
    ],
  });
  await upsertPage("stakeholder-engagements", {
    title: "Stakeholder Engagements",
    eyebrow: "Political & Party Leadership",
    intro: "",
    hero_image: "",
    hero_alt: "",
    seo_description:
      "Senator Akintunde's support for the APC national leadership and President Tinubu, and his national party assignments.",
    sections: [
      text(
        "Support for National Political Leadership",
        "Senator Akintunde has consistently demonstrated support for the national leadership of the APC and President Bola Ahmed Tinubu.\n\nDuring the presidential nomination process, he signed President Tinubu's nomination form in support of his second-term ambition. He emerged as the sole nominee from Oyo State in the exercise, which provided for one representative from each state of the federation.\n\nAt the Renewed Hope Rally held in Oyo State in January 2026, Senator Akintunde moved the motion for the adoption of President Bola Ahmed Tinubu as the sole APC candidate for the 2027 presidential election.",
      ),
      list(
        "Support for Federal Appointees from Oyo State",
        "He has also supported and rallied behind federal appointees from Oyo State, including:",
        [
          "Dr Zacch Adedeji: Chairman of the Nigeria Revenue Service (formerly FIRS).",
          "Chief Adebayo Adelabu: Former Minister of Power.",
          "Joseph Tegbe: Minister of Power.",
          "Ambassador Florence Ajimobi: Ambassadorial appointee.",
        ],
        {
          style: "bulleted",
          outro:
            "These engagements reflect his commitment to promoting the interests of Oyo State within the national political structure.",
        },
      ),
      list(
        "National Party Assignments & Political Responsibilities",
        "Senator Akintunde has been entrusted with responsibilities in important party and electoral assignments, reflecting his involvement in APC organisation and national political activities. His political assignments include:",
        [
          "2026 APC National Convention Election Committee: Nominated as a member of the Election Committee for the 2026 National Convention of the All Progressives Congress.",
          "Osun 2026 Off-Cycle Election Committee: Nominated to serve on the committee for the Osun State off-cycle election.",
          "2027 Presidential Campaign Council: Appointed Coordinator, Parliamentary Mobilisation, South-West (Senate), by the APC 2027 Presidential Campaign Council.",
        ],
        {
          outro:
            "These responsibilities place him within the party's wider efforts towards political coordination, parliamentary mobilisation and electoral organisation.\n\nThrough these engagements, Senator Akintunde continues to contribute to party development, political coordination, and the strengthening of the APC across Oyo State and the South-West.",
        },
      ),
    ],
  });

  const igp = await sitePhoto("06-igp-appointment");
  const env = await sitePhoto("29-environment-minister");
  await upsertPage(OVS, {
    title: "Oversight, Institutional Engagement & Constituency Communication",
    eyebrow: "Political & Party Leadership",
    intro:
      "Oversight is central to effective legislative representation. Senator Dr Yunus Abiodun Akintunde recognises the importance of engaging government institutions and relevant agencies to promote accountability, strengthen public service delivery and ensure that the interests of his constituents are adequately represented.",
    hero_image: `${P}02-portrait-blue.jpg#shape=portrait`,
    hero_alt: "Portrait of Senator Akintunde.",
    seo_description:
      "Senator Akintunde's oversight of government agencies, climate change engagement including COP28, and the IGBALAYE radio programme.",
    sections: [
      text(
        "Institutional Oversight & Agency Engagement",
        "In carrying out his oversight responsibilities, Senator Akintunde has actively engaged with the Nigeria Police Force, the Federal Ministry of Environment and other relevant government agencies to encourage accountability, responsiveness and improved service delivery.\n\nHis engagements reflect his commitment to ensuring that public institutions remain responsive to the needs of citizens and fulfil their statutory responsibilities.",
        igp
          ? {
              image: igp,
              caption: "With the leadership of the Nigeria Police Force.",
              ...(env ? { image2: env, caption2: "With the Minister of Environment." } : {}),
            }
          : {},
      ),
      text(
        "Climate Change Engagement & International Participation",
        "Senator Akintunde has participated in climate change engagements at national and international levels, including the 28th United Nations Climate Change Conference (COP28) in Dubai, where he delivered a lecture on the economic implications of climate change for African nations.\n\nHis participation also earned him a decorative ambassadorial appointment, further extending his involvement in climate-related discussions and engagements across different states.\n\nThese engagements form part of his broader commitment to environmental governance, institutional learning and sustainable development.",
        {
          image: `${OV}11-united-nations-office.jpg#shape=portrait`,
          caption: "At the United Nations office in Nigeria.",
          imageSide: "left",
        },
      ),
      list(
        "Constituency Engagement & Public Communication",
        "Beyond legislative and institutional responsibilities, Senator Akintunde maintains regular communication with constituents through public engagement platforms and direct interaction. To strengthen this relationship, he sponsors the IGBALAYE radio programme on:",
        [
          "Dynasty FM, Oyo: Reaching listeners across the Oyo and Ogbomoso zones.",
          "Agidigbo FM, Ibadan: Reaching audiences across the Ibadan metropolis.",
        ],
        {
          style: "bulleted",
          outro:
            "The programmes provide platforms for constituents to communicate their concerns, share opinions, make requests and contribute to discussions about representation and development.\n\nFeedback received through these engagements continues to inform his understanding of the needs and aspirations of the people of Oyo Central.",
        },
      ),
    ],
  });
}

/** The menu group links to the new page; Oversight is added under it; tabs follow menu order. */
async function menu() {
  const { data, error } = await db
    .from("menu_items")
    .select("id,label,page_slug,parent_id,sort_order");
  if (error) throw error;
  const rows = (data ?? []) as {
    id: string;
    label: string;
    page_slug: string | null;
    parent_id: string | null;
  }[];
  const group =
    rows.find((r) => r.page_slug === POL) ??
    rows.find((r) => !r.parent_id && /political/i.test(r.label));
  if (!group) return;
  const upd = async (id: string, patch: Record<string, unknown>) => {
    const res = await db.from("menu_items").update(patch).eq("id", id);
    if (res.error) throw res.error;
  };
  await upd(group.id, { page_slug: POL });
  const order = [
    "constituency-engagements",
    "campaigns-and-mobilisation",
    "stakeholder-engagements",
    OVS,
  ];
  if (!rows.some((r) => r.page_slug === OVS)) {
    const res = await db.from("menu_items").insert({
      label: "Oversight",
      parent_id: group.id,
      page_slug: OVS,
      visible: true,
      sort_order: 40,
    });
    if (res.error) throw res.error;
  }
  for (const r of rows)
    if (r.parent_id === group.id && r.page_slug && order.includes(r.page_slug))
      await upd(r.id, { sort_order: (order.indexOf(r.page_slug) + 1) * 10 });
}

export async function applyPoliticalOversightSkills(progress: (msg: string) => void) {
  progress("Arranging Skills, Jobs & Empowerment…");
  await skills();
  progress("Adding the new school, classroom and health centre photos…");
  await infrastructure();
  await outreach();
  await cards();
  progress("Creating the Political Leadership and Oversight pages…");
  await politicalPages();
  progress("Updating the top menu…");
  await menu();
}
