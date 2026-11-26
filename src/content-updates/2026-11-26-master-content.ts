import { db } from "@/lib/db";
import { hostBundledImages } from "@/lib/bundled-images";
import { BIO_SECTIONS, BIO_TIMELINE, DEFAULT_SETTINGS } from "@/lib/cms-defaults";
import { LGAS } from "@/lib/lgas";

/*
 * The office's master content ("SYA website update"), applied across the site:
 * every project, legislative, recognition and political page rebuilt from the document,
 * with consistent status labels ([Completed], [Ongoing], [Awarded], [Planned]) and the
 * local government tabs filled from the project record. Existing photo galleries are kept.
 * Also: the homepage, biography and footer text, the menu, the achievement cards, the
 * press-story categories, and the Oyo State 2026 APC Presidential Rally photos.
 */

type Sec = Record<string, unknown> & {
  type: string;
  heading?: string;
  tab?: string;
  lga?: string;
  images?: { url: string; caption: string }[];
  items?: unknown[];
};

const text = (heading: string, body: string, extra: Partial<Sec> = {}): Sec => ({
  type: "text",
  heading,
  body,
  image: "",
  caption: "",
  imageSide: "right",
  ...extra,
});
const list = (
  heading: string,
  items: string[],
  intro = "",
  extra: Partial<Sec> & { style?: "bulleted" | "numbered"; outro?: string } = {},
): Sec => ({ type: "list", heading, intro, items, style: "bulleted", ...extra });

async function getPage(slug: string) {
  const { data, error } = await db
    .from("site_pages")
    .select("id,title,eyebrow,intro,sections")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d = data as {
    id: string;
    title: string;
    eyebrow: string;
    intro: string;
    sections: unknown;
  };
  return { ...d, sections: (Array.isArray(d.sections) ? d.sections : []) as Sec[] };
}

async function savePage(
  slug: string,
  fields: { title?: string; eyebrow?: string; intro?: string; seo_description?: string },
  sections: Sec[],
) {
  const res = await db
    .from("site_pages")
    .update({ ...fields, sections: await hostBundledImages(sections) })
    .eq("slug", slug);
  if (res.error) throw res.error;
}

/** An existing photo gallery, found by its heading, moved to a tab (photos are kept as they are). */
function carry(
  from: Sec[],
  re: RegExp,
  place: { tab?: string; lga?: string; heading?: string } = {},
): Sec[] {
  const g = from.find((s) => s.type === "gallery" && re.test(String(s.heading ?? "")));
  if (!g || !g.images?.length) return [];
  const out: Sec = { ...g, tab: place.tab ?? "", lga: place.lga ?? "" };
  if (place.heading) out.heading = place.heading;
  return [out];
}

/** Keep every gallery tagged with a local government. */
const lgaGalleries = (from: Sec[]) => from.filter((s) => s.type === "gallery" && s.lga);
const topicHub = (from: Sec[], heading: string, topic: string): Sec =>
  from.find((s) => s.type === "topic") ?? { type: "topic", heading, intro: "", topic };

// =============================================================================== Project record
type ByLga = Record<string, string[]>;
const add = (m: ByLga, lga: string, ...items: string[]) => {
  (m[lga] ??= []).push(...items);
};

/** Education, by local government (renovations, new blocks, ICT centres, other schools). */
function educationByLga(): ByLga {
  const m: ByLga = {};
  // Completed new classroom blocks
  add(
    m,
    "Ogo Oluwa",
    "[Completed] Community High School, Lagbedu: One two-classroom block with furniture.",
  );
  add(
    m,
    "Atiba",
    "[Completed] Oranyan Grammar School, Sabo, Oyo: One two-classroom block with an office and furniture.",
  );
  add(
    m,
    "Oyo West",
    "[Completed] ADS Grammar School, Opapa: One two-classroom block with an office and furniture.",
  );
  add(
    m,
    "Oyo East",
    "[Completed] L.A. Primary School, Jabata: One two-classroom block with an office and furniture.",
  );
  add(
    m,
    "Egbeda",
    "[Completed] Olode Primary School, Olode: One two-classroom block with an office and furniture.",
  );
  add(
    m,
    "Lagelu",
    "[Completed] Christ Basic School, Bioku Etile: One two-classroom block with an office and furniture.",
  );
  // Ongoing
  add(
    m,
    "Atiba",
    "[Ongoing] Oranyan Grammar School, Sabo: Two blocks of six classrooms, a 500-capacity multipurpose hall and an e-library.",
  );
  add(
    m,
    "Afijio",
    "[Ongoing] Ilu-Aje Community High School: Three six-classroom blocks with furniture and conventional toilet facilities comprising five toilets each for male and female students.",
  );
  // Renovated classroom locations (renovation programme covering 23 public schools)
  add(m, "Surulere", "Muslim Comprehensive High School, Oko: Classroom renovation.");
  add(
    m,
    "Oluyole",
    "Liberty Secondary Commercial Academy, Odo-Ona Elewe Road, Ibadan: Classroom renovation.",
  );
  add(
    m,
    "Oyo East",
    "Durbar Grammar School, Oyo: Classroom renovation.",
    "Ansarudeen Primary School, Oke Balogun: Classroom renovation.",
  );
  add(m, "Oyo West", "Ansarudeen Primary School, Alagbon: Classroom renovation.");
  add(m, "Afijio", "Baptist Secondary School, Oke-Isanmi, Ilora: Classroom renovation.");
  add(
    m,
    "Akinyele",
    "Ojoo High School, Akinyele: Classroom renovation.",
    "Iroko Community Grammar School, Iroko: Classroom renovation.",
    "Ebenezer Community Primary School, Akingbile: Classroom renovation.",
  );
  add(m, "Egbeda", "Christ Church Anglican School 1 and 2, Wakajaye: Classroom renovation.");
  add(
    m,
    "Ona Ara",
    "Aho Parapo Community Secondary School, Amuloko: Rehabilitation in 2025 under the National Productivity Centre's rehabilitation of selected schools in Oyo Central.",
  );
  add(
    m,
    "Lagelu",
    "Community Grammar School, Apatere: One block of two classrooms with an office and furniture.",
  );
  // ICT centres
  add(m, "Akinyele", "Ojoo Secondary School: ICT centre.");
  add(m, "Oyo West", "Army Children Secondary School, Ojongbodu: ICT centre.");
  add(m, "Surulere", "Baptist Secondary Grammar School: ICT centre.");
  add(m, "Ogo Oluwa", "Lagbedu Community High School, Lagbedu: ICT centre.");
  // Other schools in the education project and beneficiary records
  const other: ByLga = {
    Afijio: [
      "St. John Anglican Basic School, Akinmorin",
      "Baptist Secondary School, Ilora",
      "Awe High School, Awe",
      "Community Secondary School, Jobele",
      "Community High School, Fiditi",
      "Fiditi Grammar School, Fiditi",
    ],
    Akinyele: [
      "Ebenezer Community Primary School, Akingbile",
      "Ajibade Alabata Community Grammar School",
      "Ajibode Grammar School, Ajibode, Ibadan",
      "Community Grammar School, Ikereku",
    ],
    Atiba: [
      "Alaafin High School, Oyo",
      "St. Michael Primary School, Esiele",
      "Oke Olola Community Secondary School",
      "St. Mary Anglican Primary School, Iyalamu",
      "L.A. Primary School, Koso",
    ],
    Egbeda: [
      "Adewolu/Ifesowapo Community Primary School, Oluwo",
      "Anglican Primary School, Wakajaiye",
      "Idito High School",
      "SDA Owobaale Primary School",
    ],
    Lagelu: [
      "Gbena/Kajola Primary School, Monatan",
      "Methodist Primary School, Olomoyoyo",
      "Community High School, Ejioku",
      "SS Peter Primary School, Offa",
    ],
    "Ogo Oluwa": [
      "Obandi Community High School, Odo-Oba",
      "D.C. School, Ojutaye",
      "Baptist Basic School, Aiyegun Yemetu",
      "Community High School, Otamokun",
    ],
    Oluyole: [
      "St. Mathias Basic School, Ibuso Gboro",
      "St. Michael Primary School, Odo-Ona Nla",
      "Pegba Community Primary School",
      "Aiyegun Community Primary School",
    ],
    "Ona Ara": [
      "Oke Ogbere Community Secondary School",
      "Atolu Primary School",
      "Aho Parapo Community Secondary School, Amuloko",
      "Community Grammar School, Araromi Aperin",
    ],
    "Oyo East": [
      "Methodist Primary School, Apaara",
      "St. Bernadine’s Girls Grammar School",
      "L.A. Basic School, New Durbar",
      "St. Mary’s RCM Basic School, Asogo",
    ],
    "Oyo West": [
      "L.A. Primary School, Bola",
      "Methodist Primary School, Akeetan, Oyo",
      "Baptist High School, Isokun, Oyo",
      "St. Philip Primary School, Aladie, Fasola, Oyo",
    ],
    Surulere: [
      "D.C. Basic School, Odokoto, Agbonni",
      "Baptist Basic School, Ogbada",
      "Alayin Community High School",
      "Community High School, Iresa Apa",
    ],
  };
  // Plain names (no status claimed); skip schools already listed above.
  for (const [l, schools] of Object.entries(other))
    add(
      m,
      l,
      ...schools.filter(
        (s) => !(m[l] ?? []).some((x) => x.replace(/^\[\w+\]\s*/, "").startsWith(s)),
      ),
    );
  return m;
}

function roadsByLga(): ByLga {
  const m: ByLga = {};
  add(
    m,
    "Oluyole",
    "[Ongoing] Ayegun–Oleyo Road: Rehabilitation of the 17-kilometre road.",
    "[Awarded] Olomi–Omiyale–Adigun Link Road.",
  );
  add(
    m,
    "Akinyele",
    "[Ongoing] Alabata Junction–Elekuru–Olaleye–Onibonla Village Road: Rehabilitation to improve access and movement within the affected communities.",
    "[Completed] Aroro-Makinde: Construction of drainage systems.",
    "[Awarded] Kolapo Ishola Layout Road, Orogun.",
  );
  add(
    m,
    "Oyo West",
    "[Ongoing] Ojongbodu erosion control and channelisation: Works to address drainage and erosion challenges.",
    "[Awarded] Internal roads at Oke Isokun.",
    "[Awarded] Selected inner roads in Gedu Scheme.",
  );
  add(m, "Egbeda", "[Awarded] Kamjat Junction to Raji Sekere, Gbagi Area.");
  add(m, "Lagelu", "[Awarded] Kajola Street, Monatan.");
  add(m, "Ona Ara", "[Awarded] Ifedapo Estate Road.");
  add(m, "Oyo East", "[Awarded] Alaodi Road, Akesan.");
  add(m, "Afijio", "[Awarded] Jagun Road, Ilora.");
  add(m, "Atiba", "[Awarded] Alapo–Agunpopo Road, Agunpopo Area.");
  add(m, "Ogo Oluwa", "[Awarded] Ijebu Street Road, Odo-Oba.");
  add(m, "Surulere", "[Awarded] Elesin Street Road, Oko.");
  return m;
}

const BOREHOLES: Record<string, number> = {
  Akinyele: 12,
  Lagelu: 14,
  Egbeda: 10,
  Oluyole: 10,
  "Ona Ara": 11,
  "Oyo East": 10,
  "Oyo West": 11,
  Afijio: 9,
  Surulere: 8,
  "Ogo Oluwa": 10,
  Atiba: 10,
};

const POLICE: Record<string, string[]> = {
  Akinyele: [
    "Moniya Area Command",
    "Moniya Divisional Headquarters",
    "Iroko Police Outpost",
    "Ijaye Police Outpost",
    "Ojoo Divisional Headquarters",
    "Orogun Police Outpost",
  ],
  Lagelu: [
    "Iyana Offa Divisional Headquarters",
    "Alakia Adelubi Divisional Headquarters",
    "Monatan Divisional Headquarters",
    "Jonku Police Outpost",
    "Kajorepo Divisional Headquarters",
    "Akobo Divisional Headquarters",
    "Olorunda-Aba Divisional Headquarters",
  ],
  "Ona Ara": ["Ogbere Divisional Headquarters", "Akanran Divisional Headquarters"],
  Egbeda: [
    "Egbeda Divisional Headquarters",
    "Ogungbade Divisional Headquarters",
    "Airport Police Headquarters",
    "Gbagi Area Command",
  ],
  Oluyole: [
    "Idi Ayunre Divisional Headquarters",
    "Toll Gate Divisional Headquarters",
    "Orita Challenge Police Station",
  ],
  "Ogo Oluwa": [
    "Ajaawa Divisional Headquarters",
    "Opete Divisional Headquarters",
    "Civil Defence facility",
  ],
  Surulere: [
    "Iresaadu Divisional Headquarters",
    "Iresaapa Divisional Headquarters",
    "Okoo Divisional Headquarters",
    "Okin-Apa Divisional Headquarters",
  ],
  Atiba: ["Atiba Divisional Headquarters"],
  Afijio: [
    "Awe Divisional Headquarters",
    "Jobele Divisional Headquarters",
    "Ilora Divisional Headquarters",
    "Fiditi Divisional Headquarters",
  ],
  "Oyo East": ["Durbar Police Station", "Passport Office"],
  "Oyo West": ["Ojongbodu Divisional Headquarters"],
};

function marketsByLga(): ByLga {
  const m: ByLga = {};
  add(m, "Ogo Oluwa", "Ajaawa Market: Market intervention.");
  add(m, "Afijio", "Iware Market: Market intervention.");
  add(m, "Oyo East", "Araromi Market: Market intervention.");
  add(m, "Ona Ara", "Zawiya Market: Market intervention.");
  add(
    m,
    "Oyo West",
    "Irepo Market: Market intervention.",
    "[Ongoing] Irepo Market, Oyo: Construction of an ultra-modern market.",
  );
  add(m, "Lagelu", "Olorunda Market: Market intervention.");
  add(m, "Oluyole", "Olode Village Market: Market intervention.");
  add(
    m,
    "Akinyele",
    "Traders and artisans: ₦7 million cash grant, including beneficiaries at Ojoo Market.",
    "Ojoo Market: Support for 40 market men and women.",
    "Market traders: Revolving loan support.",
    "Akinyele Cattle Market: Transformer donated.",
  );
  return m;
}

// =============================================================================== Infrastructure
async function infrastructure() {
  const slug = "infrastructure-projects";
  const p = await getPage(slug);
  if (!p) return;
  const old = p.sections;
  const E = "Education & ICT",
    R = "Roads & Drainage",
    W = "Water Supply",
    S = "Solar Streetlights & Security",
    M = "Markets & Traders";
  const edu = educationByLga(),
    roads = roadsByLga(),
    markets = marketsByLga();

  const district: Sec[] = [
    // A. Education and ICT development
    text(
      "Education and ICT development",
      "Education is one of the central areas of Senator Akintunde’s constituency development programme. His interventions include classroom renovation, new school buildings, educational facilities, ICT infrastructure and support for students.",
      { tab: E },
    ),
    list(
      "School renovation programme",
      [
        "Muslim Comprehensive High School, Oko, Surulere.",
        "Liberty Secondary Commercial Academy, Odo-Ona Elewe Road, Ibadan, Oluyole.",
        "Durbar Grammar School, Oyo, Oyo East.",
        "Ansarudeen Primary School, Oke Balogun, Oyo East.",
        "Ansarudeen Primary School, Alagbon, Oyo West.",
        "Baptist Secondary School, Oke-Isanmi, Ilora, Afijio.",
        "Ojoo High School, Akinyele, Ibadan.",
        "Iroko Community Grammar School, Iroko, Akinyele.",
        "Ebenezer Community Primary School, Akingbile, Akinyele.",
        "Christ Church Anglican School 1 and 2, Wakajaye, Egbeda.",
      ],
      "A school renovation programme covering 23 public schools is ongoing across Oyo Central. The supplied project record identifies the following renovated classroom locations:",
      { tab: E, style: "numbered" },
    ),
    list(
      "Construction of new classroom blocks",
      [
        "[Completed] Community High School, Lagbedu, Ogo-Oluwa: One two-classroom block with furniture.",
        "[Completed] Oranyan Grammar School, Sabo, Oyo, Atiba: One two-classroom block with an office and furniture.",
        "[Completed] ADS Grammar School, Opapa, Oyo West: One two-classroom block with an office and furniture.",
        "[Completed] L.A. Primary School, Jabata, Oyo East: One two-classroom block with an office and furniture.",
        "[Completed] Olode Primary School, Olode, Egbeda: One two-classroom block with an office and furniture.",
        "[Completed] Christ Basic School, Bioku Etile, Lagelu: One two-classroom block with an office and furniture.",
        "[Ongoing] Oranyan Grammar School, Sabo, Atiba: Two blocks of six classrooms, a 500-capacity multipurpose hall and an e-library.",
        "[Ongoing] Ilu-Aje Community High School, Afijio: Three six-classroom blocks with furniture and conventional toilet facilities comprising five toilets each for male and female students.",
      ],
      "The programme includes completed classroom projects and larger school facilities under construction.",
      { tab: E },
    ),
    ...carry(old, /^Commissioning of New Classrooms/i, { tab: E }),
    ...carry(old, /^Classroom Projects in Progress/i, { tab: E }),
    list(
      "Federal College of Education (Special), Oyo",
      [
        "New administrative building.",
        "2,000-capacity lecture theatre.",
        "1,500-capacity lecture theatre.",
        "Guidance and Counselling Building.",
        "Internal roads and drainage.",
      ],
      "Interventions at the Federal College of Education (Special), Oyo, include:",
      { tab: E },
    ),
    ...carry(old, /^FCE \(Special\)/i, { tab: E }),
    list(
      "ICT centres",
      [
        "Ojoo Secondary School, Akinyele.",
        "Army Children Secondary School, Ojongbodu, Oyo West.",
        "Baptist Secondary Grammar School, Surulere.",
        "Lagbedu Community High School, Lagbedu, Ogo-Oluwa.",
      ],
      "Four ICT centres have been facilitated at:",
      { tab: E, style: "numbered" },
    ),
    ...carry(old, /^ICT Centres$/i, { tab: E, heading: "ICT centres in pictures" }),
    text(
      "Student support",
      "Senator Akintunde facilitates the annual distribution of 100 Unified Tertiary Matriculation Examination (UTME) application forms to support students seeking admission into tertiary institutions.",
      { tab: E },
    ),
    text(
      "Additional schools across Oyo Central",
      "The wider constituency education project and beneficiary records also include further schools in every local government. They are listed under each local government’s tab below.",
      { tab: E },
    ),

    // C. Roads
    text(
      "Road infrastructure and drainage",
      "Road infrastructure is an important part of Senator Akintunde’s constituency development agenda. His road interventions include rehabilitation, community access roads, drainage and erosion control.",
      { tab: R },
    ),
    list(
      "Ongoing road projects",
      [
        "[Ongoing] Ayegun–Oleyo Road, Oluyole LGA: Rehabilitation of the 17-kilometre Ayegun–Oleyo Road.",
        "[Ongoing] Alabata Junction–Elekuru–Olaleye–Onibonla Village Road, Akinyele LGA: Rehabilitation of the road to improve access and movement within the affected communities.",
        "[Ongoing] Ojongbodu Erosion Control and Channelisation, Oyo West LGA: Ongoing erosion control and channelisation works to address drainage and erosion challenges.",
      ],
      "",
      { tab: R },
    ),
    list(
      "Completed drainage intervention",
      [
        "[Completed] Aroro-Makinde, Akinyele LGA: Construction of drainage systems at Aroro-Makinde.",
      ],
      "",
      { tab: R },
    ),
    list(
      "Other awarded road projects",
      [
        "[Awarded] Kolapo Ishola Layout Road, Orogun, Akinyele.",
        "[Awarded] Kamjat Junction to Raji Sekere, Gbagi Area, Egbeda.",
        "[Awarded] Kajola Street, Monatan, Lagelu.",
        "[Awarded] Olomi–Omiyale–Adigun Link Road, Oluyole.",
        "[Awarded] Ifedapo Estate Road, Ona-Ara.",
        "[Awarded] Alaodi Road, Akesan, Oyo East.",
        "[Awarded] Internal Roads at Oke Isokun, Oyo West.",
        "[Awarded] Jagun Road, Ilora, Afijio.",
        "[Awarded] Alapo–Agunpopo Road, Agunpopo Area, Atiba.",
        "[Awarded] Ijebu Street Road, Odo-Oba, Ogo-Oluwa.",
        "[Awarded] Elesin Street Road, Oko, Surulere.",
        "[Awarded] Selected inner roads in Gedu Scheme, Oyo West.",
      ],
      "The constituency road project record also includes the following awarded projects. Their individual completion status will be reflected in subsequent project updates:",
      { tab: R },
    ),
    ...carry(old, /^Roads, Water and Classrooms/i, {
      tab: R,
      heading: "Roads and projects across the district",
    }),
    ...carry(old, /^Project Commissioning/i, { tab: R }),

    // D. Water
    text(
      "Water supply and solar-powered boreholes",
      "Access to clean water is a major component of Senator Akintunde’s constituency intervention programme.\n\nOyo Central has 118 wards, and the solar-powered borehole programme is designed to provide water access across the district, including additional strategic public locations.",
      { tab: W },
    ),
    list(
      "Borehole delivery",
      ["[Completed] 89 solar-powered boreholes: Completed and delivered out of 120 promised."],
      "",
      {
        tab: W,
        outro:
          "The programme’s stated coverage includes the 118 wards and four additional strategic locations.",
      },
    ),
    list(
      "Local government distribution in the project record",
      [
        "Akinyele: 12",
        "Lagelu: 14",
        "Egbeda: 10",
        "Oluyole: 10",
        "Ona-Ara: 11",
        "Oyo East: 10",
        "Oyo West: 11",
        "Afijio: 9",
        "Surulere: 8",
        "Ogo-Oluwa: 10",
        "Atiba: 10",
      ],
      "",
      { tab: W },
    ),
    list(
      "Additional strategic locations identified",
      [
        "Oyo School of Nursing Campus, Oyo General Hospital, Owode, Oyo.",
        "Sabo Market, Sabo, Oyo.",
      ],
      "",
      {
        tab: W,
        outro:
          "The programme also identifies four additional strategic locations beyond the ward-based coverage.",
      },
    ),

    // E. Streetlights
    text(
      "Solar streetlights and community security",
      "Senator Akintunde’s solar streetlighting interventions are intended to improve visibility, support safer movement at night and strengthen security around communities and public facilities.",
      { tab: S },
    ),
    list(
      "Streetlighting",
      [
        "[Completed] More than 9,000 solar-powered streetlights: Installed across Oyo Central.",
        "[Ongoing] An additional 4,200 solar-powered streetlights: Under implementation across the district.",
      ],
      "",
      { tab: S },
    ),
    text(
      "Security lighting",
      "A security lighting component provides for 150 solar lights allocated to police formations and security facilities across the district. The identified locations include the Oyo State Police Command, Eleyele, Ibadan, and the police formations and facilities listed under each local government’s tab below.\n\nThe individual installation status of some facilities is subject to project updates.\n\nThe project complements Senator Akintunde’s legislative responsibility as Deputy Chairman of the Senate Committee on Police Affairs by extending practical infrastructure support to security formations within the district.",
      { tab: S },
    ),

    // F. Markets
    text(
      "Market development and trader support",
      "Senator Akintunde’s market interventions combine physical market infrastructure with financial and economic support for traders and artisans.",
      { tab: M },
    ),
    list(
      "Market infrastructure",
      [
        "Ajaawa Market, Ogo-Oluwa.",
        "Iware Market, Afijio.",
        "Araromi Market, Oyo East.",
        "Zawiya Market, Ona-Ara.",
        "Irepo Market, Oyo West.",
        "Olorunda Market, Lagelu.",
        "Olode Village Market, Oluyole.",
      ],
      "The project record identifies interventions at the following markets:",
      { tab: M, style: "numbered" },
    ),
    list(
      "Ongoing modern market project",
      [
        "[Ongoing] Irepo Market, Oyo: Construction of an ultra-modern market at Irepo Market, Oyo, is ongoing.",
      ],
      "",
      { tab: M },
    ),
    list(
      "Financial and economic support",
      [
        "₦7 million cash grant to traders and artisans in Akinyele, including beneficiaries at Ojoo Market.",
        "₦25 million cash grant for market men and women across the 11 local government areas.",
        "Support for 40 Ojoo market men and women.",
        "Revolving loan support for market traders in Akinyele.",
      ],
      "",
      { tab: M },
    ),
    list(
      "Electricity support for markets and businesses",
      [
        "Transformer donated to Akinyele Cattle Market.",
        "33KVA transformer donated to sawmillers in Oyo town.",
      ],
      "",
      { tab: M },
    ),
  ];

  const perLga: Sec[] = [];
  for (const l of LGAS) {
    if (edu[l]?.length) perLga.push(list("Education", edu[l]!, "", { lga: l }));
    if (roads[l]?.length) perLga.push(list("Roads & Drainage", roads[l]!, "", { lga: l }));
    const water = [`Solar-powered boreholes: ${BOREHOLES[l]} in the project record.`];
    if (l === "Atiba") water.push("Sabo Market, Sabo, Oyo: Additional strategic location.");
    perLga.push(list("Water Supply", water, "", { lga: l }));
    if (POLICE[l]?.length)
      perLga.push(
        list(
          "Solar Streetlights & Security",
          POLICE[l]!.map((x) => `${x}: Security lighting component.`),
          "",
          { lga: l },
        ),
      );
    if (markets[l]?.length) perLga.push(list("Market Development", markets[l]!, "", { lga: l }));
  }

  await savePage(
    slug,
    {
      title: "Infrastructure Projects",
      eyebrow: "Constituency projects",
      intro:
        "Education and ICT development, roads and drainage, water supply, solar streetlights and market development across the 11 local government areas of Oyo Central.",
    },
    [
      ...district,
      ...perLga,
      ...lgaGalleries(old),
      topicHub(old, "Infrastructure in each local government", "infrastructure"),
    ],
  );
}

// =============================================================================== Healthcare & community
async function outreach() {
  const slug = "outreach";
  const p = await getPage(slug);
  if (!p) return;
  const old = p.sections;
  const H = "Healthcare & Medical Outreach",
    C = "Community Development";
  const sections: Sec[] = [
    text(
      "Healthcare and medical outreach",
      "Senator Akintunde’s healthcare interventions combine medical outreach, access to specialist services, support for healthcare facilities and assistance to constituents requiring medical attention.",
      { tab: H },
    ),
    text(
      "Optical medical outreach",
      "The optical medical outreach programme has reached 3,680 beneficiaries across the 11 local government areas of Oyo Central.\n\nThe programme provides access to eye examinations and related optical support for constituents.\n\nIn addition, 350 medical slots were facilitated through Federal Government channels, with further beneficiaries reached through other interventions. Ten special cases were identified and sponsored for surgery.",
      { tab: H },
    ),
    list(
      "Primary healthcare infrastructure",
      [
        "Isokun, Oyo West: Construction of a 20-bed Primary Healthcare Centre.",
        "Isokun, Oyo West: Renovation of the existing Primary Healthcare Centre.",
        "Pakoyi Health Centre, Oyo West: Provision of sanitary facilities.",
      ],
      "",
      { tab: H },
    ),
    ...carry(old, /Isokun/i, { tab: H, heading: "Primary Healthcare Centre, Isokun" }),
    list(
      "Community medical support",
      [
        "Basic health screenings across the 11 local government areas.",
        "Blood pressure checks.",
        "Malaria and blood glucose screening.",
        "Vaccination support.",
        "Provision of medications and medical supplies.",
        "Public health awareness.",
        "Referrals to hospitals and medical specialists.",
        "Financial assistance towards medical bills for selected patients.",
      ],
      "Other healthcare interventions include:",
      {
        tab: H,
        outro:
          "These interventions are intended to improve access to basic healthcare and support constituents who require medical attention.",
      },
    ),

    text(
      "Community development and social interventions",
      "Senator Akintunde’s community development activities also include support for public institutions, traditional institutions, religious communities and local groups.",
      { tab: C },
    ),
    list(
      "Interventions recorded",
      [
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
      "",
      {
        tab: C,
        outro:
          "These interventions form part of the wider constituency engagement programme and support for community institutions.",
      },
    ),

    list(
      "Healthcare",
      [
        "Isokun: Construction of a 20-bed Primary Healthcare Centre and renovation of the existing Primary Healthcare Centre.",
        "Pakoyi Health Centre: Provision of sanitary facilities.",
      ],
      "",
      { lga: "Oyo West" },
    ),
    list(
      "Community Development",
      [
        "Ajawa Central Mosque: Financial donation.",
        "Ogo-Oluwa Muslim community: Financial donation.",
      ],
      "",
      { lga: "Ogo Oluwa" },
    ),
    list(
      "Community Development",
      ["Oko Palace: Financial donation.", "Iresaapa Palace: Financial donation."],
      "",
      { lga: "Surulere" },
    ),
    list("Community Development", ["Ojoo youths: Financial donation."], "", { lga: "Akinyele" }),
    ...lgaGalleries(old).filter((g) => !/Isokun/i.test(String(g.heading))),
    topicHub(old, "Outreach in each local government", "outreach"),
  ];
  await savePage(
    slug,
    {
      title: "Healthcare & Community Development",
      eyebrow: "Constituency projects",
      intro:
        "Medical outreach, healthcare facilities and support for community institutions across Oyo Central.",
    },
    sections,
  );
}

// =============================================================================== Skills, jobs, agriculture
async function skills() {
  const slug = "skills-jobs-and-empowerment";
  const p = await getPage(slug);
  if (!p) return;
  const old = p.sections;
  const G = "Skills & Empowerment",
    A = "Agriculture",
    J = "Employment";
  const keepLga = old.filter(
    (s) => s.lga && !/ICT centre|Traders' support/i.test(String(s.heading)) && s.type !== "topic",
  );
  const sections: Sec[] = [
    text(
      "Human capital development and skills acquisition",
      "Senator Akintunde’s empowerment programme focuses on practical skills, vocational training, tools and equipment that can help beneficiaries improve their livelihoods.",
      { tab: G },
    ),
    list(
      "Skills training and equipment distribution",
      [
        "Tailoring: 465 participants trained, with sewing machines and honoraria provided.",
        "Information and Communication Technology: 439 participants trained, with Android tablet phones and honoraria provided.",
        "Phone repairs: 316 youths trained, with toolboxes and honoraria provided.",
        "Women empowerment: 250 women received grinding mill machines.",
        "Mechanics: 100 mechanics received toolboxes.",
        "Welding: 100 welders received toolboxes and welding machines.",
        "Digital skills for artisans: 55 artisans received laptops and honoraria.",
      ],
      "",
      { tab: G, style: "numbered" },
    ),
    ...carry(old, /^Digital Skills for Artisans/i, { tab: G }),
    ...carry(old, /^Digital Marketing Skills/i, { tab: G }),
    list(
      "International and institutional training",
      [
        "Four women sponsored to participate in a UN Women training programme.",
        "Women also participated in training programmes under the Federal Ministry of Women Affairs, the UN Women Department and the Ford Foundation.",
      ],
      "",
      { tab: G },
    ),
    list(
      "Clean cooking support",
      ["A total of 3,500 eco-friendly clean cooking stoves were distributed across Oyo Central."],
      "",
      { tab: G },
    ),
    list(
      "Conditional cash transfer",
      [
        "A total of 500 beneficiaries received ₦50,000 each under a conditional cash transfer intervention.",
      ],
      "",
      { tab: G },
    ),

    text(
      "Agricultural support",
      "Agricultural support is part of Senator Akintunde’s efforts to assist farmers with inputs and equipment for improved farming activities.",
      { tab: A },
    ),
    list(
      "The project record includes",
      [
        "7,200 NPK fertilisers.",
        "2,000 knapsack sprayers.",
        "Herbicides and pesticides.",
        "500 bags of yam seeds.",
        "300 bags of hybrid maize seeds.",
        "2,000 packets of hybrid tomato seeds.",
        "300 pairs of rain boots.",
        "300 pairs of rubber gloves.",
      ],
      "",
      {
        tab: A,
        outro:
          "The interventions are intended to support farmers with agricultural inputs and practical equipment for farming activities.",
      },
    ),

    text(
      "Employment facilitation",
      "Senator Akintunde has facilitated employment opportunities for constituents across federal institutions and public agencies.",
      { tab: J },
    ),
    list(
      "Institutional employment facilitation",
      [
        "National Biosafety Management Agency: 2 placements.",
        "Transmission Company of Nigeria: 6 placements.",
        "Nigeria Police Force: 25 placements.",
        "National Park Service: 3 placements.",
        "National Bureau of Statistics: 1 placement.",
        "Nigeria Revenue Service, formerly FIRS: 26 placements.",
        "Federal School of Surveying, Oyo: 2 placements.",
        "Federal College of Education (Special), Oyo: 2 placements.",
        "Police Service Commission: 1 placement.",
        "Federal Polytechnic, Ayede: 5 placements.",
        "Yaba College of Technology (YABATECH): 1 placement.",
      ],
      "The reported placements include:",
      {
        tab: J,
        outro:
          "Total reported institutional placements: 74.\n\nIn addition to these placements, constituents have also gained admission into the Nigeria Police Academy, Wudil, Kano. These admissions are presented separately from the institutional placement figure.",
      },
    ),
    ...carry(old, /^Job Beneficiaries/i, { tab: J }),
    text(
      "Constituency liaison structure",
      "Senator Akintunde has appointed 42 aides across the 11 local government areas as liaison officers and special assistants.\n\nThe structure is intended to improve communication between the Senator’s office and communities, coordinate constituency engagements and provide a channel through which local needs can be brought to the attention of the appropriate authorities.",
      { tab: J },
    ),
    ...keepLga,
    topicHub(old, "Empowerment in each local government", "empowerment"),
  ];
  await savePage(
    slug,
    {
      title: "Skills, Jobs & Empowerment",
      eyebrow: "Constituency projects",
      intro:
        "Skills acquisition, equipment, social support, agricultural inputs and employment facilitation for constituents of Oyo Central.",
    },
    sections,
  );
}

// =============================================================================== Projects overview
async function overview() {
  const slug = "constituency-interventions-and-development-projects";
  const p = await getPage(slug);
  if (!p) return;
  const cards = [
    [
      "A. Education and ICT development",
      "Classroom renovation, new school buildings, the Federal College of Education (Special), Oyo, four ICT centres and annual UTME support. See Infrastructure Projects → Education & ICT.",
    ],
    [
      "B. Healthcare and medical outreach",
      "Optical outreach for 3,680 beneficiaries, primary healthcare facilities at Isokun and Pakoyi, and community medical support. See Healthcare & Community Development.",
    ],
    [
      "C. Road infrastructure and drainage",
      "Ongoing rehabilitation of the Ayegun–Oleyo and Alabata Junction roads, erosion control at Ojongbodu, and awarded road projects across the district. See Infrastructure Projects → Roads & Drainage.",
    ],
    [
      "D. Water supply and solar-powered boreholes",
      "89 solar-powered boreholes completed and delivered out of 120 promised, across the 118 wards. See Infrastructure Projects → Water Supply.",
    ],
    [
      "E. Solar streetlights and community security",
      "More than 9,000 solar streetlights installed, 4,200 more under implementation, and security lighting at police formations. See Infrastructure Projects → Solar Streetlights & Security.",
    ],
    [
      "F. Market development and trader support",
      "Interventions at seven markets, an ultra-modern market at Irepo, cash grants, loans and transformers. See Infrastructure Projects → Markets & Traders.",
    ],
    [
      "G. Human capital development and skills acquisition",
      "Tailoring, ICT, phone repairs, equipment for women, mechanics and welders, clean cooking stoves and cash transfers. See Skills, Jobs & Empowerment.",
    ],
    [
      "H. Agricultural support",
      "Fertilisers, sprayers, seeds and protective equipment for farmers. See Skills, Jobs & Empowerment → Agriculture.",
    ],
    [
      "I. Employment facilitation",
      "74 reported placements in federal institutions, plus Police Academy admissions. See Skills, Jobs & Empowerment → Employment.",
    ],
    [
      "J. Community development and social interventions",
      "Support for public, traditional and religious institutions and local groups. See Healthcare & Community Development → Community Development.",
    ],
  ];
  const sections: Sec[] = [
    {
      type: "cards",
      heading: "Interventions by sector",
      intro: "The following sections provide details of the interventions by sector.",
      items: cards.map(([title, t]) => ({ title, text: t, image: "" })),
    },
    {
      type: "finder",
      heading: "Find a project by local government and category",
      intro:
        "Filter every project recorded on the Infrastructure, Healthcare & Community Development and Skills, Jobs & Empowerment pages by local government, intervention category and status.",
    },
  ];
  await savePage(
    slug,
    {
      title: "Constituency Projects and Interventions",
      eyebrow: "Constituency projects",
      intro:
        "Development across the 11 local government areas. Senator Akintunde’s constituency interventions are designed to address community needs through projects, programmes and support initiatives across Oyo Central’s 118 wards.",
    },
    sections,
  );
}

// =============================================================================== Legislative work
const BILLS = [
  "Federal University of Geomatics (Establishment) Bill, 2024 (SB.497): The bill seeks to establish the Federal University of Geomatics through the upgrade of the existing School of Surveying.",
  "Federal University of Education (Special), Oyo (Establishment) Bill, 2024 (SB.67): The bill seeks to upgrade the Federal College of Education (Special), Oyo, into a Federal University of Education (Special).",
  "Federal Polytechnic, Ayede (Establishment) Bill, 2025 (SB.859): The bill seeks to provide a statutory framework for the establishment of the Federal Polytechnic, Ayede.",
  "Matrimonial Causes (Amendment) Bill, 2025 (SB.944): A proposed amendment to the existing Matrimonial Causes legislation.",
  "Motor Vehicles (Prohibition of Tinted Glass) (Amendment) Bill, 2025 (SB.945): The bill proposes amendments to the law governing the prohibition of tinted glass on motor vehicles.",
  "Mandatory Payment of Child Support by Biological Fathers Bill, 2025 (SB.947): The bill addresses the responsibility of biological fathers to provide financial support for their children.",
  "Federal Medical Centres Act (Amendment) Bill, 2025 (SB.1017): The bill seeks to provide for the establishment of a 100-bed Mother and Child Hospital at Ona-Ara Local Government Area.",
];
const MOTIONS = [
  "Motion to Halt Proposed Electricity Tariff Increase, 25 July 2023: Senator Akintunde participated in legislative efforts to address the proposed increase in electricity tariffs and its implications for Nigerians.",
  "Motion Appealing to Resident Doctors to Suspend Nationwide Industrial Action, 28 July 2023: He participated in the Senate’s appeal to resident doctors to suspend their nationwide industrial action and consider the implications for healthcare delivery.",
  "Motion on the Welfare of Retired Police Officers: He supported a motion addressing the welfare of retired police officers. The motion subsequently passed into law.",
];

async function bills() {
  const slug = "bills-and-motions";
  const p = await getPage(slug);
  if (!p) return;
  const old = p.sections;
  const sections: Sec[] = [
    list("Bills sponsored and supported", BILLS, "", { style: "numbered" }),
    list("Motions and legislative advocacy", MOTIONS, "", { style: "numbered" }),
    text(
      "Welfare of police retirees",
      "As Deputy Chairman of the Senate Committee on Police Affairs, Senator Akintunde joined the Committee Chairman and the Senate leadership, Senate President Godswill Akpabio and Senate Leader Opeyemi Bamidele, in an engagement with police retirees at the National Assembly.\n\nHe was fully involved in discussions on resolving concerns surrounding the Contributory Pension Scheme, and thanked the retirees for their patience and commitment as work continues to ensure that fairness, dignity and proper recognition are extended to those who have served the nation.",
    ),
    list(
      "Proposed bills at the stakeholders’ engagement",
      [
        "Federal University of Education (Special), Oyo, Oyo State (Establishment) Bill, 2024 (SB.67)",
        "Federal University of Geomatics, Oyo, Oyo State (Establishment) Bill, 2024 (SB.497)",
      ],
      "The Senate Committee on Tertiary Institutions and TETFund held a one-day public hearing on Monday, 30 June 2025 at the National Assembly. The two bills are:",
      { style: "numbered" },
    ),
    ...carry(old, /^At the Public Hearing/i),
    ...carry(old, /^In the Senate$/i),
  ];
  await savePage(
    slug,
    {
      title: "Bills & Motions",
      eyebrow: "Legislative work",
      intro:
        "Senator Akintunde’s legislative responsibilities include lawmaking, representation, committee assignments, oversight and advocacy on issues affecting Oyo Central and Nigeria as a whole.\n\nHis legislative work covers education, healthcare, public safety, infrastructure, economic development and institutional reform.",
    },
    sections,
  );
}

async function committees() {
  const slug = "committees-and-oversight";
  const p = await getPage(slug);
  if (!p) return;
  const old = p.sections;
  const pol = await getPage("political-leadership-and-party-engagement");
  const polOld = pol?.sections ?? [];
  const LM = "Leadership & Membership",
    O = "Oversight";
  const climate = polOld.find((s) => /^Climate Change Engagement/i.test(String(s.heading)));
  const keepTabs = old.filter((s) => s.tab && s.tab !== LM);
  const sections: Sec[] = [
    list(
      "Leadership positions",
      [
        "Pioneer Chairman, Senate Committee on South West Development Commission.",
        "Deputy Chairman, Senate Committee on Police Affairs.",
        "Former Chairman, Senate Committee on Environment, until May 2025.",
      ],
      "",
      { tab: LM },
    ),
    list(
      "Committee memberships",
      [
        "Appropriations",
        "Finance",
        "Marine Transport and Blue Economy",
        "Air Force",
        "Diaspora and Non-Governmental Organisations",
        "Federal Character and Inter-Governmental Affairs",
        "Water Resources",
        "Power",
        "National Planning and Economic Affairs",
        "Rules and Business",
        "Science and Technology",
        "Interparliamentary Affairs",
        "Privatisation",
        "Media and Public Affairs",
        "Local Content",
      ],
      "Senator Akintunde has served on the following Senate committees:",
      { tab: LM, style: "numbered" },
    ),
    ...keepTabs,
    text(
      "Oversight and institutional engagement",
      "His oversight and institutional engagements include interactions with the Nigeria Police Force, the Federal Ministry of Environment and other government agencies.\n\nThese responsibilities provide opportunities to examine institutional performance, engage relevant authorities and advocate improvements in public service delivery.",
      { tab: O },
    ),
    ...(climate
      ? [
          text(
            "Climate change engagement",
            "Senator Akintunde participated in the Nigerian delegation to the 28th United Nations Climate Change Conference (COP28) in Dubai, where he delivered a lecture on the economic implications of climate change for African nations.\n\nThese engagements form part of his broader commitment to environmental governance, institutional learning and sustainable development.",
            { tab: O },
          ),
        ]
      : []),
  ];
  await savePage(
    slug,
    {
      title: "Committees & Oversight",
      eyebrow: "Legislative work",
      intro:
        "Senate committee responsibilities: leadership positions, committee memberships, and oversight and institutional engagement in the 10th Senate.",
    },
    sections,
  );
}

async function recognition() {
  const slug = "recognition";
  const p = await getPage(slug);
  if (!p) return;
  const old = p.sections;
  const sections: Sec[] = [
    list(
      "International and national engagements",
      [
        "Republic of Korea Parliamentary Guests’ Programme, April 2025: Senator Akintunde was invited by the Government of the Republic of Korea as the sole Nigerian representative in a distinguished parliamentary guests’ programme held in Seoul from 20 to 26 April 2025.",
        "COP28, Dubai: He participated in the Nigerian delegation to the United Nations Climate Change Conference, COP28, in Dubai, where he delivered a lecture on the economic implications of climate change for African nations.",
      ],
      "",
      { style: "numbered" },
    ),
    list(
      "Academic and institutional recognition",
      [
        "UI@75 Ambassador, University of Ibadan, November 2023: Recognised as an ambassador during the University of Ibadan’s 75th anniversary activities.",
        "Vice-Chancellor’s Special Meritorious Service Award, Federal University Oye-Ekiti, January 2024: Recognised for contributions relating to environmental management.",
        "Guest Lecturer and Award of Honour, University of Uyo, 8 October 2024: Participated in the second edition of the Prof. Nyaudoh U. Ndaeyo Public Lecture Series as guest lecturer and recipient of a University Award of Honour.",
        "Guest Lecturer, LAUTECH Alumni Association: Invited to deliver the 17th Annual Lecture of the LAUTECH Alumni Association.",
        "Meritorious Service Award, Nigerian Society of Engineers, Ibadan Branch, 2012: Recognised for service and contributions.",
      ],
      "",
      { style: "numbered" },
    ),
    list("Public and civic recognition", [
      "Best Senator of the Year 2025, Nigerian Union of Journalists, Oyo State Council.",
      "Patron, National Youth Council of Nigeria, Oyo State Chapter.",
      "First President, Centre for Petroleum, Energy Economics and Law Students Association (CPEELSA), University of Ibadan.",
    ]),
    ...carry(old, /^Recognition in pictures/i),
  ];
  await savePage(
    slug,
    {
      title: "Awards and Recognition",
      eyebrow: "About",
      intro:
        "Recognition for public service and institutional engagement. Dedication to public service, legislative work and institutional development has brought Senator Dr Yunus Abiodun Akintunde recognition through professional honours, academic engagements, international invitations and public service awards.",
    },
    sections,
  );
}

// =============================================================================== Political leadership
const RALLY = Array.from({ length: 9 }, (_, i) => ({
  url: `/site-images/rally/${String(i + 1).padStart(2, "0")}-oyo-2026-apc-presidential-rally.jpg`,
  caption: "Oyo State 2026 APC Presidential Rally",
}));

async function political() {
  const slug = "political-leadership-and-party-engagement";
  const p = await getPage(slug);
  if (!p) return;
  const old = p.sections;
  const CE = "Constituency Engagements",
    CM = "Campaigns & Mobilisation",
    SE = "Stakeholder Engagements";
  const sections: Sec[] = [
    text(
      "APC reconciliation and party organisation",
      "Senator Akintunde has participated in reconciliation efforts within the APC in Oyo State, supporting engagements aimed at strengthening party unity and cooperation.\n\nHe has also provided strategic and financial support for party meetings, organisation and mobilisation.",
      { tab: CE },
    ),
    list(
      "Electoral support and mobilisation",
      [
        "The 2024 local government elections in Oyo State.",
        "The 2025 Ibadan North Federal Constituency bye-election.",
        "Renewed Hope Ambassador sensitisation rallies across Oyo State.",
      ],
      "His political engagements include support for APC candidates and party activities during:",
      { tab: CE },
    ),

    text(
      "Support for APC support groups",
      "Senator Akintunde has supported APC support groups and the City Boy Movement with five Sienna campaign buses to strengthen mobilisation and grassroots engagement.",
      { tab: CM },
    ),
    {
      type: "gallery",
      tab: CM,
      lga: "",
      heading: "Oyo State 2026 APC Presidential Rally",
      images: RALLY,
    },
    ...carry(old, /^APC Campaigns$/i, { tab: CM }),

    text(
      "Support for President Bola Ahmed Tinubu",
      "Senator Akintunde signed President Bola Ahmed Tinubu’s nomination form in support of his second-term aspiration and was the sole nominee from Oyo State in that nomination process.\n\nAt the January 2026 Renewed Hope Rally in Oyo State, he moved the motion for the adoption of President Tinubu as the sole APC presidential candidate for the 2027 general election.",
      { tab: SE },
    ),
    list(
      "Support for federal appointees from Oyo State",
      [
        "Dr Zacch Adedeji: Chairman, Nigeria Revenue Service.",
        "Chief Adebayo Adelabu: Former Minister of Power.",
        "Chief Joseph Olasunkanmi Tegbe: Honourable Minister of Power.",
        "Ambassador Florence Ajimobi: Ambassadorial appointee.",
      ],
      "During the Senate Screening, Senator Akintunde has supported and engaged with federal appointees from Oyo State, including:",
      { tab: SE },
    ),
    list(
      "National political assignments",
      [
        "Member, 2026 APC National Convention Election Committee.",
        "Member, Osun 2026 off-cycle election committee.",
        "Coordinator, Parliamentary Mobilisation, South-West (Senate), APC 2027 Presidential Campaign Council.",
      ],
      "His party responsibilities and political assignments include:",
      {
        tab: SE,
        outro:
          "These engagements reflect his participation in party organisation and political mobilisation beyond the boundaries of Oyo Central.",
      },
    ),
    ...carry(old, /^With National Leaders/i, { tab: SE }),
  ];
  await savePage(
    slug,
    {
      title: "Political & Party Leadership",
      eyebrow: "Party organisation and political engagement",
      intro:
        "Beyond his legislative responsibilities, Senator Dr Yunus Abiodun Akintunde has been actively involved in strengthening the All Progressives Congress (APC) at state and national levels.\n\nHis political engagements include party organisation, reconciliation, electoral mobilisation, support for party candidates and participation in strategic political assignments.",
    },
    sections,
  );

  // Gallery captions use the Senator's full name as "Senator Dr …".
  const caps = await db.from("gallery_items").select("id,caption,alt");
  if (caps.error) throw caps.error;
  for (const r of (caps.data ?? []) as { id: string; caption: string; alt: string }[]) {
    const fixName = (v: string) =>
      (v ?? "").replace(
        /Senator Yunus Abiodun Akintunde,? PhD/g,
        "Senator Dr Yunus Abiodun Akintunde",
      );
    if (fixName(r.caption) !== r.caption || fixName(r.alt) !== r.alt) {
      const u = await db
        .from("gallery_items")
        .update({ caption: fixName(r.caption), alt: fixName(r.alt) })
        .eq("id", r.id);
      if (u.error) throw u.error;
    }
  }

  // The rally photos also go in the media gallery, under the 2027 campaign.
  const hosted = await hostBundledImages(RALLY);
  const g = await db.from("gallery_items").select("url");
  if (g.error) throw g.error;
  const have = new Set(((g.data ?? []) as { url: string }[]).map((r) => r.url));
  const rows = hosted
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
  if (rows.length) {
    const res = await db.from("gallery_items").insert(rows);
    if (res.error) throw res.error;
  }
}

// =============================================================================== Settings
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

async function settings() {
  const d = DEFAULT_SETTINGS;
  const home = await readSetting("home");
  await writeSetting("home", {
    ...home,
    heroTitle: d.home.heroTitle,
    heroBody: d.home.heroBody,
    stats: d.home.stats,
    intro: d.home.intro,
    tagline: d.home.tagline,
    focusHeading: d.home.focusHeading,
    focusAreas: d.home.focusAreas,
    glanceHeading: d.home.glanceHeading,
    glanceIntro: d.home.glanceIntro,
    featuredTitle: d.home.featuredTitle,
    featuredBody: d.home.featuredBody,
    legislativeUpdates: d.home.legislativeUpdates,
    projectUpdates: d.home.projectUpdates,
    ctaTitle: d.home.ctaTitle,
    ctaBody: d.home.ctaBody,
    ...(typeof home["campaignVideoCaption"] === "string"
      ? {
          campaignVideoCaption: home["campaignVideoCaption"].replace(
            /Senator Yunus Abiodun Akintunde, PhD/g,
            "Senator Dr Yunus Abiodun Akintunde",
          ),
        }
      : {}),
  });

  // Biography: the master text, keeping the photos already chosen for each part.
  const bio = await readSetting("biography");
  const oldSecs = (Array.isArray(bio["sections"]) ? bio["sections"] : []) as {
    heading: string;
    image?: string;
    caption?: string;
  }[];
  const photo = (re: RegExp) => oldSecs.find((s) => re.test(s.heading));
  const sections = BIO_SECTIONS.map((s) => {
    const was = /^Early life/i.test(s.heading)
      ? photo(/^Early life/i)
      : /^Private sector/i.test(s.heading)
        ? photo(/^Business/i)
        : /^The Book/i.test(s.heading)
          ? photo(/^The Book/i)
          : undefined;
    return was?.image ? { ...s, image: was.image, caption: was.caption ?? "" } : s;
  });
  await writeSetting("biography", {
    ...bio,
    title: d.biography.title,
    intro: d.biography.intro,
    facts: d.biography.facts,
    sections,
    photoCaption: d.biography.photoCaption,
    timelineHeading: d.biography.timelineHeading,
    timeline: BIO_TIMELINE,
  });

  const footer = await readSetting("footer");
  await writeSetting("footer", {
    ...footer,
    topLine: d.footer.topLine,
    blurb: d.footer.blurb,
    copyright: d.footer.copyright,
  });

  // The placeholder phone number is not shown until the office supplies a real one.
  const contact = await readSetting("contact");
  if (/800\s*000\s*0000/.test(String(contact["phone"] ?? "")))
    await writeSetting("contact", { ...contact, phone: "" });

  // News categories for the press stories, from their headlines.
  const press = await readSetting("press_links");
  const items = (Array.isArray(press["items"]) ? press["items"] : []) as Record<string, unknown>[];
  const rules: [string, RegExp][] = [
    ["Press Releases and Official Statements", /manhunt|school attack/i],
    [
      "Senate Activities",
      /DisCos|Police Trust Fund|development commissions|collaboration with govt on security/i,
    ],
    ["Legislative Bills and Motions", /Geomatics|bill/i],
    ["Employment Facilitation", /recruitment/i],
    ["Youth and Women Empowerment", /empowers traders|farmers|laptops/i],
    ["Constituency Projects", /days in office|years in office|commissions/i],
  ];
  const tagged = items.map((it) =>
    it["topic"]
      ? it
      : {
          ...it,
          topic:
            rules.find(([, re]) => re.test(String(it["title"])))?.[0] ??
            "Political and Party Engagements",
        },
  );
  await writeSetting("press_links", { ...press, items: tagged });
}

// =============================================================================== Achievement cards
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
      "Drainage at Aroro-Makinde (completed) and ongoing rehabilitation of the Alabata Junction–Elekuru–Olaleye–Onibonla Village Road.",
    ],
    [
      /^1 solar-powered borehole per ward \(11 wards\)\.?$/i,
      "11 solar-powered boreholes in the project record.",
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
  for (const c of (data ?? []) as { id: string; title: string; items: It[]; extra_items: It[] }[]) {
    let items = (c.items ?? []).map((it) => {
      const hit = fix.find(([re]) => re.test(it.text));
      return hit ? { ...it, text: hit[1] } : it;
    });
    // Egbeda: 10 boreholes in the project record.
    if (/^Egbeda/i.test(c.title))
      items = items.map((it) =>
        /borehole per ward \(11 wards\)|11 solar-powered boreholes in the project record/i.test(
          it.text,
        )
          ? { ...it, text: "10 solar-powered boreholes in the project record." }
          : it,
      );
    let extra = c.extra_items ?? [];
    if (/^Legislative Duties/i.test(c.title)) {
      // Same order as before for the first six bills and two motions, so their photos stay.
      const oldItems = c.items ?? [];
      const oldExtra = c.extra_items ?? [];
      items = BILLS.map((b, i) => ({
        text: b.slice(0, b.indexOf(":")),
        image: oldItems[i]?.image ?? "",
      }));
      extra = MOTIONS.map((m, i) => ({
        text: m.slice(0, m.indexOf(":")),
        image: oldExtra[i]?.image ?? "",
      }));
    }
    const res = await db
      .from("achievement_cards")
      .update({ items, extra_items: extra })
      .eq("id", c.id);
    if (res.error) throw res.error;
  }
}

// =============================================================================== Menu
async function menu() {
  const { data, error } = await db
    .from("menu_items")
    .select("id,label,parent_id,page_slug,href,sort_order");
  if (error) throw error;
  type M = {
    id: string;
    label: string;
    parent_id: string | null;
    page_slug: string | null;
    href: string | null;
    sort_order: number;
  };
  const rows = (data ?? []) as M[];
  const by = (re: RegExp) => rows.find((r) => re.test(r.label));
  const upd = async (id: string, patch: Partial<M>) => {
    const r = await db.from("menu_items").update(patch).eq("id", id);
    if (r.error) throw r.error;
  };
  const hub = rows.find(
    (r) => r.page_slug === "constituency-interventions-and-development-projects",
  );
  if (hub && hub.parent_id) {
    // "Constituency Projects" becomes its own top-level menu, with an overview link first.
    await upd(hub.id, {
      parent_id: null,
      label: "Constituency Projects",
      page_slug: null,
      href: null,
      sort_order: 35,
    });
    const ins = await db.from("menu_items").insert({
      label: "All projects & project finder",
      parent_id: hub.id,
      page_slug: "constituency-interventions-and-development-projects",
      href: null,
      sort_order: 5,
      visible: true,
    });
    if (ins.error) throw ins.error;
  }
  const outreach = rows.find((r) => r.page_slug === "outreach");
  if (outreach) await upd(outreach.id, { label: "Healthcare & Community Development" });
  const rec = rows.find((r) => r.page_slug === "recognition");
  if (rec) await upd(rec.id, { label: "Awards & Recognition" });
  const gal = by(/^Media Gallery$/i);
  if (gal) await upd(gal.id, { label: "Photo & Video Gallery" });
}

export async function applyMasterContent(progress: (msg: string) => void) {
  progress("Updating the homepage, biography and footer text…");
  await settings();
  progress("Rebuilding Infrastructure Projects (education, roads, water, streetlights, markets)…");
  await infrastructure();
  progress("Rebuilding Healthcare & Community Development…");
  await outreach();
  progress("Rebuilding Skills, Jobs & Empowerment…");
  await skills();
  progress("Rebuilding the Constituency Projects overview and project finder…");
  await overview();
  progress("Updating Bills & Motions, Committees & Oversight and Awards & Recognition…");
  await committees();
  await bills();
  await recognition();
  progress("Updating Political & Party Leadership and adding the rally photos…");
  await political();
  progress("Correcting the achievement cards…");
  await cards();
  progress("Updating the menu…");
  await menu();
}
