import { db } from "@/lib/db";
import { hostBundledImages } from "@/lib/bundled-images";

/*
 * The facts from the office's master content ("SYA website update"), put into the existing
 * pages without changing their layout: corrected figures and wording in place, a few extra
 * list items, and the rally photos. Runs after the rollback of the master-content update.
 */

type Sec = Record<string, unknown> & {
  type: string;
  heading?: string;
  tab?: string;
  lga?: string;
  body?: string;
  intro?: string;
  outro?: string;
  items?: unknown[];
  images?: { url: string; caption: string }[];
};

const DR = (v: string) =>
  v.replace(/Senator Yunus Abiodun Akintunde,? PhD/g, "Senator Dr Yunus Abiodun Akintunde");

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
    .update({ ...fields, sections: await hostBundledImages(out) })
    .eq("slug", slug);
  if (r.error) throw r.error;
}

const find = (secs: Sec[], re: RegExp, lga?: string) =>
  secs.find(
    (s) => re.test(String(s.heading ?? "")) && (lga === undefined || (s.lga ?? "") === lga),
  );
const strItems = (s: Sec | undefined) =>
  ((s?.items ?? []) as unknown[]).map((x) =>
    typeof x === "string" ? x : String((x as { text?: string })?.text ?? x ?? ""),
  );
const setItems = (s: Sec | undefined, items: string[]) => {
  if (s) s.items = items;
};
const replaceIn = (
  s: Sec | undefined,
  key: "body" | "intro" | "outro",
  from: string | RegExp,
  to: string,
) => {
  if (s && typeof s[key] === "string") s[key] = (s[key] as string).replace(from, to);
};

// ------------------------------------------------------------------ Infrastructure Projects
async function infrastructure() {
  await editPage("infrastructure-projects", (secs) => {
    replaceIn(
      find(secs, /^Solar-Powered Borehole Project/i),
      "body",
      "The intervention has reached most of the 118 wards. The outstanding locations have already been awarded for execution and are expected to be completed in due course.",
      "89 solar-powered boreholes have been completed and delivered out of 120 promised. The programme covers the 118 wards and four additional strategic locations, including the Oyo School of Nursing Campus, Oyo General Hospital, Owode, Oyo, and Sabo Market, Sabo, Oyo.",
    );
    const light = find(secs, /^Light Up Oyo Central/i);
    setItems(light, [
      "First Phase: More than 9,000 solar-powered streetlights have been installed across the 118 wards of the senatorial district, providing a minimum of 20 units to each ward. The initiative extends beyond major roads and streets to include markets, traditional palaces, health centres, police stations, churches, mosques, motorcyclists’ parks and other strategic public spaces. Party leaders and other well-meaning community members also benefited from the distribution.",
      "Second Phase, Additional 4,200 Solar Lights: An additional 4,200 solar-powered streetlights are under implementation across the eleven local government areas of Oyo Central.",
      "Security Lighting at Police and Security Formations: A security lighting component provides for 150 solar lights at police formations and other security facilities across the senatorial district, listed under each local government's tab below. The installation status of some facilities is subject to project updates.",
    ]);
    replaceIn(
      find(secs, /^Supporting Security Personnel/i),
      "body",
      /\n\nA further phase of the Light Up Oyo Central initiative is also planned[^\n]*/,
      "",
    );
    const elec = find(secs, /^Electricity & Transformer/i);
    if (elec && !strItems(elec).some((t) => /Cattle Market/i.test(t)))
      setItems(elec, [...strItems(elec), "Donation of a transformer to Akinyele Cattle Market."]);
    const mk = find(secs, /^Market Development & Economic/i);
    if (mk && typeof mk.body === "string" && !/Irepo/.test(mk.body))
      mk.body = mk.body.replace(
        "The markets are listed under each local government's tab below.",
        "The markets are listed under each local government's tab below. Construction of an ultra-modern market at Irepo Market, Oyo, is ongoing.",
      );

    // Local government lists: no status claimed where the record gives none.
    for (const s of secs) {
      if (s.type !== "list" || !s.lga) continue;
      s.items = strItems(s).map((t) =>
        t
          .replace(
            /: Identified for new classroom construction\.$/,
            ": In the constituency education project record.",
          )
          .replace(/\s*\(scheduled for installation\)$/, "")
          .replace(/^(Community Grammar School, Apatere): Completed\. /, "$1: "),
      );
    }
    for (const s of secs)
      if (s.type === "list" && s.lga)
        replaceIn(
          s,
          "outro",
          "The listed installations are subject to completion as scheduled.",
          "The installation status of some facilities is subject to project updates.",
        );
    // Christ Basic School, Bioku Etile is in Lagelu.
    const bioku =
      "Christ Basic School, Bioku Etile: Completed. Construction of one block of two classrooms, with an office and furniture.";
    for (const s of secs)
      if (s.type === "list" && s.lga && s.lga !== "Lagelu")
        s.items = strItems(s).filter((t) => !/^Christ Basic School, Bioku Eti/i.test(t));
    const lag = find(secs, /^Classroom blocks$/i, "Lagelu");
    if (lag && !strItems(lag).some((t) => /Bioku/i.test(t)))
      setItems(lag, [bioku, ...strItems(lag)]);
    const irepo = find(secs, /^Market development$/i, "Oyo West");
    if (irepo && !strItems(irepo).some((t) => /ultra-modern/i.test(t)))
      setItems(irepo, [
        ...strItems(irepo),
        "Irepo Market, Oyo: Construction of an ultra-modern market is ongoing.",
      ]);

    // Roads, in the existing Roads & Commissioning tab, above its photos.
    if (!find(secs, /^Road Infrastructure & Drainage/i)) {
      const at = secs.findIndex((s) => s.tab === "Roads & Commissioning");
      const roads: Sec = {
        type: "list",
        tab: "Roads & Commissioning",
        lga: "",
        heading: "Road Infrastructure & Drainage",
        style: "bulleted",
        intro:
          "Road infrastructure is an important part of Senator Akintunde’s constituency development agenda. His road interventions include rehabilitation, community access roads, drainage and erosion control.",
        outro:
          "Also awarded: Kolapo Ishola Layout Road, Orogun (Akinyele); Kamjat Junction to Raji Sekere, Gbagi Area (Egbeda); Kajola Street, Monatan (Lagelu); Olomi–Omiyale–Adigun Link Road (Oluyole); Ifedapo Estate Road (Ona-Ara); Alaodi Road, Akesan (Oyo East); Internal Roads at Oke Isokun (Oyo West); Jagun Road, Ilora (Afijio); Alapo–Agunpopo Road, Agunpopo Area (Atiba); Ijebu Street Road, Odo-Oba (Ogo-Oluwa); Elesin Street Road, Oko (Surulere); and selected inner roads in Gedu Scheme (Oyo West). Their individual completion status will be reflected in subsequent project updates.",
        items: [
          "Ayegun–Oleyo Road, Oluyole (ongoing): Rehabilitation of the 17-kilometre Ayegun–Oleyo Road.",
          "Alabata Junction–Elekuru–Olaleye–Onibonla Village Road, Akinyele (ongoing): Rehabilitation of the road to improve access and movement within the affected communities.",
          "Ojongbodu Erosion Control and Channelisation, Oyo West (ongoing): Erosion control and channelisation works to address drainage and erosion challenges.",
          "Aroro-Makinde, Akinyele (completed): Construction of drainage systems at Aroro-Makinde.",
        ],
      };
      secs.splice(at >= 0 ? at : secs.length, 0, roads);
    }
  });
}

// ------------------------------------------------------------------ Outreach
async function outreach() {
  await editPage("outreach", (secs) => {
    const cov = find(secs, /^Outreach Coverage and Beneficiaries/i);
    if (cov) {
      cov.intro =
        "The optical medical outreach programme has reached 3,680 beneficiaries across the 11 local government areas of Oyo Central, providing access to eye examinations and related optical support. This includes:";
      cov.items = [
        "350 Medical Slots: Facilitated through Federal Government channels for constituents of Oyo Central Senatorial District.",
        "Additional Beneficiaries: Reached through other interventions sponsored by Senator Akintunde to expand the reach of the programme.",
      ];
    }
    replaceIn(
      find(secs, /^Specialised Eye Surgery/i),
      "body",
      "were identified and are awaiting surgery.",
      "were identified and sponsored for surgery.",
    );
    const hf = find(secs, /^Healthcare Facilities & Medical Interventions/i);
    if (hf && !strItems(hf).some((t) => /Isokun/i.test(t)))
      setItems(hf, [
        "Primary Healthcare Centre, Isokun: Construction of a 20-bed Primary Healthcare Centre and renovation of the existing Primary Healthcare Centre at Isokun, Oyo West.",
        ...strItems(hf),
      ]);
    if (!find(secs, /^Community Development & Social Interventions/i)) {
      const at = secs.findIndex((s) => s.tab === "Community Outreach") + 1;
      secs.splice(at > 0 ? at : 0, 0, {
        type: "list",
        tab: "Community Outreach",
        lga: "",
        heading: "Community Development & Social Interventions",
        style: "bulleted",
        intro:
          "Senator Akintunde’s community development activities also include support for public institutions, traditional institutions, religious communities and local groups. These include:",
        outro:
          "These interventions form part of the wider constituency engagement programme and support for community institutions.",
        items: [
          "Financial support towards the renovation of the Immigration Office in Oyo.",
          "Donation of a brand-new Siena bus to the Hausa community at Oyo cemetery.",
          "Donation of a Siena bus to the Mufasir of Oyo.",
          "Financial donation to Ajawa Central Mosque.",
          "Financial donation to Oko Palace.",
          "Financial donation to Iresaapa Palace.",
          "Financial donation to the Ogo-Oluwa Muslim community.",
          "Financial donations to religious centres across Oyo State.",
          "Financial donation to Ojoo youths.",
          "Financial support to artisans.",
        ],
      });
    }
  });
}

// ------------------------------------------------------------------ Skills & overview
async function skills() {
  await editPage("skills-jobs-and-empowerment", (secs) => {
    const jobs = find(secs, /^Youth Employment & Federal Government/i);
    replaceIn(
      jobs,
      "intro",
      "access to over 50 gainful employment opportunities",
      "74 reported employment placements",
    );
    if (jobs) {
      setItems(
        jobs,
        strItems(jobs).map((t) =>
          /^National Bureau of Statistics$/i.test(t.trim())
            ? "National Bureau of Statistics: 1 staff."
            : t,
        ),
      );
      if (typeof jobs.outro === "string" && !/Total reported/.test(jobs.outro))
        jobs.outro = `Total reported institutional placements: 74.\n\n${jobs.outro}`;
    }
  });
  await editPage("constituency-interventions-and-development-projects", (secs) => {
    for (const s of secs)
      if (s.type === "list")
        s.items = strItems(s).map((t) =>
          t.replace(
            "Facilitation of over 50 federal government employment opportunities",
            "Facilitation of 74 reported federal government employment placements",
          ),
        );
  });
}

// ------------------------------------------------------------------ Legislative work
async function legislative() {
  await editPage("bills-and-motions", (secs) => {
    for (const s of secs)
      if (s.type === "list")
        s.items = strItems(s).map((t) =>
          t.replace(/SB\.\s?496/g, "SB.497").replace(/\(SB\. 67\)/g, "(SB.67)"),
        );
    const bills = find(secs, /^Bills Sponsored and Supported/i);
    if (bills && !strItems(bills).some((t) => /SB\.1017/.test(t)))
      setItems(bills, [
        ...strItems(bills),
        "Federal Medical Centres Act (Amendment) Bill, 2025 (SB.1017): A bill seeking to provide for the establishment of a 100-bed Mother and Child Hospital at Ona-Ara Local Government Area.",
      ]);
    const motions = find(secs, /^Motions Sponsored and Supported/i);
    if (motions)
      setItems(motions, [
        ...strItems(motions)
          .map((t) =>
            t
              .replace(
                /^Motion to Halt the Proposed Increase in Electricity Tariff:/,
                "Motion to Halt the Proposed Increase in Electricity Tariff, 25 July 2023:",
              )
              .replace(
                /^Motion Appealing to Resident Doctors to Suspend Nationwide Industrial Action:/,
                "Motion Appealing to Resident Doctors to Suspend Nationwide Industrial Action, 28 July 2023:",
              ),
          )
          .filter((t) => !/Retired Police Officers/i.test(t)),
        "Motion on the Welfare of Retired Police Officers: Senator Akintunde supported a motion addressing the welfare of retired police officers. The motion subsequently passed into law.",
      ]);
    const ret = find(secs, /^Welfare of Police Retirees/i);
    if (ret)
      ret.body =
        "As the Deputy Chairman of the Senate Committee on Police Affairs, he joined the Committee Chairman and the Senate leadership, Senate President Godswill Akpabio, and Senate Leader Opeyemi Bamidele in a critical engagement with police retirees at the National Assembly.\n\nThe welfare of security personnel remains a priority, and he was fully involved in discussions on resolving concerns surrounding the Contributory Pension Scheme.\n\nHe appreciated the retirees for their patience and commitment, as work continues to ensure that fairness, dignity and proper recognition are extended to those who have served the nation faithfully.";
  });

  await editPage("committees-and-oversight", (secs) => {
    for (const s of secs)
      if (s.type === "list")
        s.items = strItems(s).map((t) =>
          t
            .replace(
              "Senate Committee on Diaspora & NGO.",
              "Senate Committee on Diaspora and Non-Governmental Organisations.",
            )
            .replace("Senate Committee on Privatization.", "Senate Committee on Privatisation.")
            .replace(
              /^Former Chairman, Senate Committee on Environment\.$/,
              "Former Chairman, Senate Committee on Environment, until May 2025.",
            ),
        );
  });

  await editPage("recognition", (secs) => {
    const h = find(secs, /^Honours and engagements/i);
    if (h && typeof h.body === "string") {
      h.body = h.body
        .replace(
          "where he participated in discussions on the economic implications of climate change for African nations. Following his contribution and speech at the engagement, he received a decorative ambassadorial appointment.",
          "where he delivered a lecture on the economic implications of climate change for African nations.",
        )
        .replace(
          /On the intellectual front,[^\n]*/,
          "He received the Vice-Chancellor’s Special Meritorious Service Award from the Federal University Oye-Ekiti in January 2024 for contributions relating to environmental management. On 8 October 2024 he was guest lecturer at the second edition of the Prof. Nyaudoh U. Ndaeyo Public Lecture Series at the University of Uyo, where he received a University Award of Honour. He was also invited to deliver the 17th Annual Lecture of the LAUTECH Alumni Association, and received a Meritorious Service Award from the Nigerian Society of Engineers, Ibadan Branch, in 2012.\n\nHe was named Best Senator of the Year 2025 by the Nigerian Union of Journalists, Oyo State Council. He is Patron of the National Youth Council of Nigeria, Oyo State Chapter, and was the first President of the Centre for Petroleum, Energy Economics and Law Students Association (CPEELSA), University of Ibadan.",
        );
    }
    const ps = find(secs, /^Public Service & Legislative Leadership/i);
    if (ps && !strItems(ps).some((t) => /Environment/i.test(t)))
      setItems(ps, [
        ...strItems(ps),
        "Former Chairman, Senate Committee on Environment (until May 2025).",
      ]);
  });
}

// ------------------------------------------------------------------ Political
const RALLY = Array.from({ length: 9 }, (_, i) => ({
  url: `/site-images/rally/${String(i + 1).padStart(2, "0")}-oyo-2026-apc-presidential-rally.jpg`,
  caption: "Oyo State 2026 APC Presidential Rally",
}));

async function political() {
  await editPage("political-leadership-and-party-engagement", (secs) => {
    replaceIn(
      find(secs, /^Party Reconciliation/i),
      "body",
      "the 2024 local government elections, the 2025 Ibadan North Federal Constituency bye-election, and the Osun state governorship election in 2026.",
      "the 2024 local government elections in Oyo State, the 2025 Ibadan North Federal Constituency bye-election, and the Renewed Hope Ambassador sensitisation rallies across Oyo State.",
    );
    const app = find(secs, /^Support for Federal Appointees/i);
    if (app) {
      app.intro =
        "During the Senate Screening, Senator Akintunde has supported and engaged with federal appointees from Oyo State, including:";
      setItems(
        app,
        strItems(app).map((t) =>
          t.replace(
            /^Joseph Tegbe: Minister of Power\.$/,
            "Chief Joseph Olasunkanmi Tegbe: Honourable Minister of Power.",
          ),
        ),
      );
    }
    replaceIn(
      find(secs, /^Climate Change Engagement/i),
      "body",
      /\n\nHis participation also earned him a decorative ambassadorial appointment[^\n]*/,
      "",
    );
    if (!find(secs, /^Oyo State 2026 APC Presidential Rally/i)) {
      const at = secs.findIndex(
        (s) => s.type === "gallery" && /^APC Campaigns$/i.test(String(s.heading)),
      );
      secs.splice(at >= 0 ? at : secs.length, 0, {
        type: "gallery",
        tab: "Campaigns & Mobilisation",
        lga: "",
        heading: "Oyo State 2026 APC Presidential Rally",
        images: RALLY,
      });
    }
  });

  const hosted = await hostBundledImages(RALLY);
  const g = await db.from("gallery_items").select("id,url,caption,alt");
  if (g.error) throw g.error;
  const rowsNow = (g.data ?? []) as { id: string; url: string; caption: string; alt: string }[];
  for (const r of rowsNow)
    if (DR(r.caption ?? "") !== r.caption || DR(r.alt ?? "") !== r.alt) {
      const u = await db
        .from("gallery_items")
        .update({ caption: DR(r.caption ?? ""), alt: DR(r.alt ?? "") })
        .eq("id", r.id);
      if (u.error) throw u.error;
    }
  const have = new Set(rowsNow.map((r) => r.url));
  const add = hosted
    .filter((r) => !have.has(r.url))
    .map((r, i) => ({
      kind: "image",
      url: r.url,
      alt: "Senator Akintunde at the Oyo State 2026 APC Presidential Rally",
      caption: r.caption,
      category: "2027 Campaign Trail",
      published: true,
      archived: false,
      sort_order: -100 + i,
    }));
  if (add.length) {
    const r = await db.from("gallery_items").insert(add);
    if (r.error) throw r.error;
  }
}

// ------------------------------------------------------------------ Settings
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

const BOOK =
  "As an energy economist and policy advocate, Senator Akintunde authored Dimensions of Energy Poverty and Rural Electrification in Nigeria to contribute to the national conversation on one of the most critical challenges facing the country: access to reliable, affordable and sustainable energy. The book is the product of years of research and empirical analysis into the causes, dimensions and implications of energy poverty, particularly in rural communities where millions of Nigerians remain underserved.\n\nThe book examines how energy poverty extends beyond the absence of electricity to include limited access to clean cooking energy, inadequate energy infrastructure, and the inability of households and businesses to meet their basic energy needs. It also explores the transformative role of rural electrification in promoting economic growth, reducing poverty, improving healthcare and education outcomes, and enhancing the overall quality of life for rural populations.\n\nDrawing on his research findings, he recommends adopting renewable energy technologies such as solar mini-grids, expanding off-grid solutions, increasing funding for rural electrification programmes, supporting energy innovators, and developing policies that encourage investment in rural energy infrastructure. He maintains that addressing energy poverty is essential for achieving sustainable development, improving living standards, and unlocking the economic potential of rural Nigeria.\n\nThe book was formally presented on 7 March 2022 at the International Conference Centre (ICC), University of Ibadan, by former Head of State, Abdulsalami Abubakar, GCFR, and His Imperial Majesty Oba Lamidi Olayiwola Atanda Adeyemi III, the late Alaafin of Oyo. In line with his commitment to knowledge sharing and policy advocacy, the publication was made available free of charge to researchers, students, policymakers, development practitioners and members of the public.\n\nSenator Akintunde also presented a copy of the book to the President of the Federal Republic of Nigeria, Bola Ahmed Tinubu, GCFR, sharing its findings and recommendations at a time when Nigeria is pursuing ambitious reforms in the energy sector.";
const PUBLIC_SERVICE =
  "Elected in 2023, he brings experience from public administration in Oyo State to his responsibilities at the National Assembly. His previous public service engagements include appointments in the Oyo State Civil Service Commission, the Oyo State Ministry of Works and Transport and the Governor’s Office.\n\nHis experience in public administration, infrastructure development and government service informs his legislative responsibilities and constituency interventions.\n\nIn the Senate, he has held leadership positions in committees dealing with regional development, police affairs and environmental matters. He has also participated in legislative activities covering finance, appropriations, power, water resources, transportation, national planning, science and technology, among other areas.\n\nBeyond the National Assembly, Senator Akintunde has facilitated projects and programmes across Oyo Central, including classroom construction and renovation, healthcare interventions, road rehabilitation, solar-powered boreholes, streetlighting, skills acquisition, agricultural support and employment facilitation.\n\nHis representation is built around legislative engagement, community development and the pursuit of practical opportunities for the people of Oyo Central.";

async function settings() {
  const home = await readSetting("home");
  const slides = (Array.isArray(home["heroSlides"]) ? home["heroSlides"] : []) as Record<
    string,
    unknown
  >[];
  await writeSetting("home", {
    ...home,
    heroTitle: "Do More. Delivering representation through action.",
    heroBody:
      "Senator Dr Yunus Abiodun Akintunde represents Oyo Central Senatorial District in the 10th Senate of the Federal Republic of Nigeria, combining lawmaking, oversight and institutional advocacy with interventions across the 11 local government areas of Oyo Central.",
    stats: [
      { n: "9,000+", l: "Solar streetlights installed" },
      { n: "89", l: "Solar-powered boreholes delivered" },
      { n: "7", l: "Bills sponsored and supported" },
      { n: "11", l: "Local governments, 118 wards" },
    ],
    campaignVideoCaption: DR(String(home["campaignVideoCaption"] ?? "")),
    heroSlides: slides.map((s) => ({ ...s, alt: DR(String(s["alt"] ?? "")) })),
  });

  const bio = await readSetting("biography");
  const sections = (
    (Array.isArray(bio["sections"]) ? bio["sections"] : []) as Record<string, unknown>[]
  ).map((s) => {
    const h = String(s["heading"] ?? "");
    if (/^Business & public service/i.test(h))
      return {
        ...s,
        body: `${String(s["body"] ?? "").split("\n\n")[0]}\n\n${PUBLIC_SERVICE}`,
      };
    if (/^The Book/i.test(h)) return { ...s, body: BOOK };
    return s;
  });
  const has = (re: RegExp) => sections.some((s) => re.test(String(s["heading"] ?? "")));
  if (!has(/^Legislative leadership/i))
    sections.push({
      heading: "Legislative leadership",
      body: "Senator Akintunde currently serves as:\n\n• Pioneer Chairman, Senate Committee on South West Development Commission.\n• Deputy Chairman, Senate Committee on Police Affairs.\n\nHe previously served as Chairman of the Senate Committee on Environment until May 2025.",
      image: "",
      caption: "",
    });
  if (!has(/^Vision for Oyo Central/i))
    sections.push({
      heading: "Vision for Oyo Central",
      body: "Senator Akintunde’s development priorities are centred on improving access to education and healthcare, supporting community infrastructure, expanding economic opportunities, strengthening public institutions and ensuring that the needs of constituents receive attention at the national level.",
      image: "",
      caption: "",
    });
  const notes: [RegExp, string][] = [
    [
      /Civil Service Commission/i,
      "Served in the Oyo State Civil Service Commission, contributing to public administration and civil service matters.",
    ],
    [
      /Works/i,
      "Served in the state government with responsibilities relating to works, infrastructure and transportation.",
    ],
    [
      /Executive Assistant/i,
      "Served in the Governor’s Office, participating in government coordination and administration.",
    ],
    [/^Senator/i, "Represents Oyo Central Senatorial District in the 10th National Assembly."],
  ];
  const timeline = (
    (Array.isArray(bio["timeline"]) ? bio["timeline"] : []) as Record<string, unknown>[]
  ).map((t) => {
    const hit = notes.find(([re]) => re.test(String(t["title"] ?? "")));
    return hit && !t["note"]
      ? { ...t, note: hit[1] }
      : hit && /^Senator/i.test(String(t["title"]))
        ? { ...t, note: hit[1] }
        : t;
  });
  await writeSetting("biography", {
    ...bio,
    title: "Senator Dr Yunus Abiodun Akintunde",
    intro:
      "Senator Dr Yunus Abiodun Akintunde is a Nigerian public servant, legislator and political leader representing Oyo Central Senatorial District in the 10th Senate of the Federal Republic of Nigeria. He is from Onikanko Compound, Pakoyi, Oyo town.",
    sections,
    timeline,
    photoCaption: DR(String(bio["photoCaption"] ?? "")),
  });

  const footer = await readSetting("footer");
  await writeSetting("footer", {
    ...footer,
    topLine: DR(String(footer["topLine"] ?? "")),
    blurb: DR(String(footer["blurb"] ?? "")),
    copyright: DR(String(footer["copyright"] ?? "")),
  });
}

// ------------------------------------------------------------------ Achievement cards & record
async function cards() {
  const { data, error } = await db.from("achievement_cards").select("id,title,items,extra_items");
  if (error) throw error;
  type It = { text: string; image?: string };
  const fix: [RegExp, string][] = [
    [
      /^Construction of the 8km Ayegun-Oleyo Road\.?$/i,
      "Ongoing rehabilitation of the 17-kilometre Ayegun–Oleyo Road.",
    ],
    [
      /^Drainage construction at Aroro-Makinde, and from Alabata Junction/i,
      "Drainage at Aroro-Makinde (completed), and ongoing rehabilitation of the Alabata Junction–Elekuru–Olaleye–Onibonla Village Road.",
    ],
    [
      /^627 solar-powered streetlights across 11 wards, plus 1 extra borehole/i,
      "627 solar-powered streetlights across 11 wards.",
    ],
    [
      /^Construction of new classrooms at Christ Basic School, Bioku Etilo\.?$/i,
      "Ifedapo Estate Road (awarded).",
    ],
    [
      /^Construction of new classrooms at Community Grammar School, Apatere\.?$/i,
      "New classrooms at Christ Basic School, Bioku Etile (completed), and at Community Grammar School, Apatere.",
    ],
    [
      /^Solar lighting scheduled for the Awe, Jobele, Ilora and Fiditi/i,
      "Solar security lighting for the Awe, Jobele, Ilora and Fiditi police divisional headquarters",
    ],
    [
      /^Solar lighting scheduled for the Atiba/i,
      "Solar security lighting for the Atiba police divisional headquarters",
    ],
    [
      /^Construction and renovation of a Primary Healthcare Centre$/i,
      "Construction of a 20-bed Primary Healthcare Centre and renovation of the existing one at Isokun",
    ],
    [
      /^Irepo Market, with solar-powered lighting$/i,
      "Irepo Market, where an ultra-modern market is under construction (ongoing)",
    ],
  ];
  // Items are either plain text or { text, image }; keep each in the shape it had.
  const txt = (it: It | string) => (typeof it === "string" ? it : (it?.text ?? ""));
  const withText = (it: It | string, text: string): It | string =>
    typeof it === "string" ? text : { ...it, text };
  for (const c of (data ?? []) as {
    id: string;
    title: string;
    items: (It | string)[];
    extra_items: (It | string)[];
  }[]) {
    let items = (c.items ?? []).map((it) => {
      const hit = fix.find(([re]) => re.test(txt(it)));
      return hit ? withText(it, hit[1]) : it;
    });
    if (/^Egbeda/i.test(c.title))
      items = items.map((it) =>
        /^1 solar-powered borehole per ward \(11 wards\)/i.test(txt(it))
          ? withText(it, "10 solar-powered boreholes.")
          : it,
      );
    let extra = c.extra_items ?? [];
    if (/^Legislative Duties/i.test(c.title)) {
      const plain = items.length > 0 && typeof items[0] === "string";
      items = items.map((it) => withText(it, txt(it).replace(/SB\.496/g, "SB.497")));
      if (!items.some((it) => /SB\.1017/.test(txt(it)))) {
        const t = "Federal Medical Centres Act (Amendment) Bill, 2025 (SB.1017)";
        items.push(plain ? t : { text: t, image: "" });
      }
      if (!extra.some((it) => /Retired Police/i.test(txt(it)))) {
        const t = "Motion on the Welfare of Retired Police Officers";
        extra = [
          ...extra,
          extra.length && typeof extra[0] === "string" ? t : { text: t, image: "" },
        ];
      }
    }
    const r = await db
      .from("achievement_cards")
      .update({ items, extra_items: extra })
      .eq("id", c.id);
    if (r.error) throw r.error;
  }

  // The promise tracker: figures in line with the office's record.
  const cm = await db.from("commitments").select("id,detail");
  if (cm.error) throw cm.error;
  const map: [RegExp, string][] = [
    [/^6 bills sponsored or co-sponsored to date\.?$/i, "7 bills sponsored and supported to date."],
    [
      /^38 community projects delivered/i,
      "Projects in education, healthcare, roads, water, streetlighting, markets and empowerment across all 11 local governments.",
    ],
    [
      /^Building on 38 delivered projects/i,
      "Building on more than 9,000 solar streetlights and 89 solar-powered boreholes delivered in term one.",
    ],
  ];
  for (const r of (cm.data ?? []) as { id: string; detail: string }[]) {
    const hit = map.find(([re]) => re.test(r.detail ?? ""));
    if (hit) {
      const u = await db.from("commitments").update({ detail: hit[1] }).eq("id", r.id);
      if (u.error) throw u.error;
    }
  }
}

export async function applyMasterFacts(progress: (msg: string) => void) {
  progress("Updating the homepage, biography and footer wording…");
  await settings();
  progress("Correcting Infrastructure Projects (boreholes, streetlights, roads, schools)…");
  await infrastructure();
  progress("Correcting Outreach (optical outreach, healthcare, community development)…");
  await outreach();
  progress("Correcting Skills, Jobs & Empowerment and the projects overview…");
  await skills();
  progress("Correcting Bills & Motions, Committees and Recognition…");
  await legislative();
  progress("Correcting Political Leadership and adding the rally photos…");
  await political();
  progress("Correcting the achievement cards and promise tracker…");
  await cards();
}
