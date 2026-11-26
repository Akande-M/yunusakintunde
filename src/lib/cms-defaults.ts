import { SITE, img } from "@/lib/site-data";
import { siteUrl } from "@/lib/asset-url";
import apcMark from "@/assets/apc-mark.png.asset.json";
import senateSeal from "@/assets/senate-seal.png.asset.json";
import oyoArms from "@/assets/oyo-arms.png.asset.json";
import apcOnly from "@/assets/apc-only.png.asset.json";
import thumbprint from "@/assets/thumbprint.png.asset.json";

/** Shapes of the editable "Site content" settings (stored in public.site_settings). */
export type ContactSettings = { email: string; phone: string; office: string; hours: string };
export type SocialSettings = {
  facebook: string;
  instagram: string;
  x: string;
  linkedin: string;
  youtube: string;
};
/** Where to keep the subject in frame when a photo is cropped to the carousel's fixed shape. */
export const FOCUS_OPTIONS = [
  { value: "center 20%", label: "Centre (face near top)" },
  { value: "center center", label: "Centre" },
  { value: "25% 25%", label: "Left side" },
  { value: "75% 25%", label: "Right side" },
  { value: "85% 30%", label: "Far right" },
] as const;

export type HeroSlide = { url: string; alt: string; focus: string };

export type HomeSettings = {
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  stats: { n: string; l: string }[];
  quote: string;
  campaignVideoUrl: string;
  campaignVideoCaption: string;
  /** Still image shown on the film before it plays. Empty = the film-cover photo. */
  campaignVideoPoster?: string;
  heroSlides: HeroSlide[];
  /** "About" band under the hero: paragraphs separated by a blank line. */
  intro: string;
  tagline: string;
  focusHeading: string;
  focusAreas: string[];
  glanceHeading: string;
  glanceIntro: string;
  featuredTitle: string;
  featuredBody: string;
  /** "Current legislative activities" and "Project updates" on the homepage. */
  legislativeUpdates: UpdateItem[];
  projectUpdates: UpdateItem[];
  ctaTitle: string;
  ctaBody: string;
};

/** One line in the homepage update lists. Status is one of PROJECT_STATUSES, or empty. */
export type UpdateItem = { status: string; title: string; text: string };
export const PROJECT_STATUSES = ["Completed", "Ongoing", "Awarded", "Planned"] as const;

export type FooterSettings = {
  topLine: string;
  blurb: string;
  copyright: string; // {year} is replaced with the current year
  showEmblems: boolean;
};

/** The two-tier top navigation bar. Menu links themselves are edited in Admin → Menu. */
export type HeaderSettings = {
  showTopBar: boolean; // the thin bar with phone, email and social icons
  showPhone: boolean;
  showEmail: boolean;
  showSocials: boolean;
  followLabel: string;
  siteName: string;
  siteTagline: string;
  ctaLabel: string;
  ctaHref: string;
};

/** The Biography page text (photos are in Images: bioTop and bioSecond). */
export type BiographySettings = {
  eyebrow: string;
  title: string;
  intro: string;
  showApcBadge: boolean;
  facts: { n: string; l: string }[];
  /** Each part may have its own photo, shown under its heading. */
  sections: { heading: string; body: string; image?: string; caption?: string }[];
  photoCaption: string;
  timelineHeading: string;
  timeline: { year: string; title: string; note: string; current: boolean }[];
};

export type PageHeading = { eyebrow: string; title: string; lede: string };
/** Headings at the top of built-in list pages. */
export type PageHeadings = { news: PageHeading; media: PageHeading };

/** Extra content on the News & Media page. */
export type NewsPageSettings = {
  topics: string[];
  pressReleasesHeading: string;
  pressReleasesIntro: string;
  galleryHeading: string;
  galleryIntro: string;
  photoTopics: string[];
  videoTopics: string[];
  radioHeading: string;
  radioIntro: string;
  stations: { name: string; text: string }[];
  radioOutro: string;
};

export const NEWS_TOPICS = [
  "Senate Activities",
  "Legislative Bills and Motions",
  "Constituency Projects",
  "Education and Healthcare",
  "Youth and Women Empowerment",
  "Employment Facilitation",
  "Political and Party Engagements",
  "Official Visits and Meetings",
  "Press Releases and Official Statements",
] as const;

/** Every replaceable image on the site, with where it appears (shown in the admin). */
export const IMAGE_SLOTS = [
  {
    key: "portraitMain",
    label: "Main portrait",
    where: "Header logo circle, footer, Record & Agenda page",
    default: img.portraitWhite,
  },
  {
    key: "bioTop",
    label: "Biography: top photo",
    where: "Biography page, beside the name",
    default: img.portraitVictory,
  },
  {
    key: "bioSecond",
    label: "Biography: second photo",
    where: "Biography page, beside the story",
    default: img.portraitStanding,
  },
  {
    key: "supportPhoto",
    label: "Support card photo",
    where: "The shareable “I SUPPORT” card on the Support page (shown in a circle)",
    default: "/brand/support-portrait.jpg",
  },
  {
    key: "supportApc",
    label: "Support card: APC logo & thumbprint",
    where: "Bottom left of the shareable “I SUPPORT” card",
    default: "/brand/apc-thumbprint.png",
  },
  {
    key: "supportSeal",
    label: "Support card: Senate logo",
    where: "Bottom right of the shareable “I SUPPORT” card",
    default: "/brand/senate-logo.png",
  },
  {
    key: "filmCover",
    label: "Campaign film cover",
    where: "Homepage green band, until a film is added",
    default: img.portraitFist,
  },
  {
    key: "apcBadge",
    label: "APC logo with thumbprint",
    where: "APC candidate badges across the site",
    default: apcMark.url,
  },
  { key: "senateSeal", label: "Senate seal", where: "Footer emblems", default: senateSeal.url },
  {
    key: "oyoArms",
    label: "Oyo State coat of arms",
    where: "Footer emblems",
    default: oyoArms.url,
  },
  { key: "apcLogo", label: "APC logo", where: "Footer emblems", default: apcOnly.url },
  {
    key: "thumbprint",
    label: "Ballot thumbprint",
    where: "Footer emblems",
    default: thumbprint.url,
  },
] as const;

export type ImageKey = (typeof IMAGE_SLOTS)[number]["key"];
export type ImageSettings = Record<ImageKey, string>;

/** Text and portrait for the achievements carousel + the /achievements page. */
export type AchievementsSettings = {
  pageTitle: string;
  pageIntro: string;
  /** The "development record" summary above the local government cards. */
  overviewHeading: string;
  overview: string;
  record: { heading: string; items: string[] }[];
  stats: { n: string; l: string }[];
  tagline: string; // the flyer's "LET'S DO MORE"
  portrait: string;
};

export type SiteSettings = {
  achievements: AchievementsSettings;
  contact: ContactSettings;
  socials: SocialSettings;
  home: HomeSettings;
  footer: FooterSettings;
  header: HeaderSettings;
  biography: BiographySettings;
  page_headers: PageHeadings;
  images: ImageSettings;
  news_page: NewsPageSettings;
};

const DEFAULT_IMAGES = Object.fromEntries(
  IMAGE_SLOTS.map((s) => [s.key, s.default]),
) as ImageSettings;

/** The Biography page story, from the office's master content. */
export const BIO_SECTIONS: BiographySettings["sections"] = [
  {
    heading: "Public service and representation",
    body: "Elected in 2023, he brings experience from public administration in Oyo State to his responsibilities at the National Assembly. His previous public service engagements include appointments in the Oyo State Civil Service Commission, the Oyo State Ministry of Works and Transport and the Governor’s Office.\n\nHis experience in public administration, infrastructure development and government service informs his legislative responsibilities and constituency interventions.\n\nIn the Senate, he has held leadership positions in committees dealing with regional development, police affairs and environmental matters. He has also participated in legislative activities covering finance, appropriations, power, water resources, transportation, national planning, science and technology, among other areas.\n\nBeyond the National Assembly, Senator Akintunde has facilitated projects and programmes across Oyo Central, including classroom construction and renovation, healthcare interventions, road rehabilitation, solar-powered boreholes, streetlighting, skills acquisition, agricultural support and employment facilitation.\n\nHis representation is built around legislative engagement, community development and the pursuit of practical opportunities for the people of Oyo Central.",
  },
  {
    heading: "Legislative leadership",
    body: "Senator Akintunde currently serves as:\n\n• Pioneer Chairman, Senate Committee on South West Development Commission.\n• Deputy Chairman, Senate Committee on Police Affairs.\n\nHe previously served as Chairman of the Senate Committee on Environment until May 2025.",
  },
  {
    heading: "Vision for Oyo Central",
    body: "Senator Akintunde’s development priorities are centred on improving access to education and healthcare, supporting community infrastructure, expanding economic opportunities, strengthening public institutions and ensuring that the needs of constituents receive attention at the national level.",
  },
  {
    heading: "Early life & education",
    body: "Born 6 March 1962 in Onikanko Compound, Pakoyi, Oyo town. Educated at Ansar-ud-deen Model Primary School, Balogun Oyo, and Oranyan Grammar School, Oyo.\n\nHe holds an OND and a BSc in Physics (The Polytechnic, Ibadan and Lagos State University), an MSc in Public Administration and an MSc in Energy Studies (LASU), and a Ph.D. in Energy and Environmental Studies from the University of Ibadan. He is the first Nigerian to hold that doctorate.",
  },
  {
    heading: "Private sector experience",
    body: "He is the MD/CEO of Trade Codes Limited, founded in 2002, which has created over 30 permanent jobs and empowered more than 300 people across infrastructure delivery, energy advisory and upskilling.",
  },
  {
    heading: "The Book: Dimensions of Energy Poverty and Rural Electrification in Nigeria",
    body: "As an energy economist and policy advocate, Senator Akintunde authored Dimensions of Energy Poverty and Rural Electrification in Nigeria to contribute to the national conversation on one of the most critical challenges facing the country: access to reliable, affordable and sustainable energy. The book is the product of years of research and empirical analysis into the causes, dimensions and implications of energy poverty, particularly in rural communities where millions of Nigerians remain underserved.\n\nThe book examines how energy poverty extends beyond the absence of electricity to include limited access to clean cooking energy, inadequate energy infrastructure, and the inability of households and businesses to meet their basic energy needs. It also explores the transformative role of rural electrification in promoting economic growth, reducing poverty, improving healthcare and education outcomes, and enhancing the overall quality of life for rural populations.\n\nDrawing on his research findings, he recommends adopting renewable energy technologies such as solar mini-grids, expanding off-grid solutions, increasing funding for rural electrification programmes, supporting energy innovators, and developing policies that encourage investment in rural energy infrastructure. He maintains that addressing energy poverty is essential for achieving sustainable development, improving living standards, and unlocking the economic potential of rural Nigeria.\n\nThe book was formally presented on 7 March 2022 at the International Conference Centre (ICC), University of Ibadan, by former Head of State, Abdulsalami Abubakar, GCFR, and His Imperial Majesty Oba Lamidi Olayiwola Atanda Adeyemi III, the late Alaafin of Oyo. In line with his commitment to knowledge sharing and policy advocacy, the publication was made available free of charge to researchers, students, policymakers, development practitioners and members of the public.\n\nSenator Akintunde also presented a copy of the book to the President of the Federal Republic of Nigeria, Bola Ahmed Tinubu, GCFR, sharing its findings and recommendations at a time when Nigeria is pursuing ambitious reforms in the energy sector.",
  },
];

export const BIO_TIMELINE: BiographySettings["timeline"] = [
  {
    year: "1999 – 2003",
    title: "Commissioner, Oyo State Civil Service Commission",
    note: "Served in the Oyo State Civil Service Commission, contributing to public administration and civil service matters.",
    current: false,
  },
  {
    year: "2011 – 2012",
    title: "Commissioner for Works and Transport, Oyo State",
    note: "Served in the state government with responsibilities relating to works, infrastructure and transportation.",
    current: false,
  },
  {
    year: "2014 – 2015",
    title: "Executive Assistant to the Governor of Oyo State",
    note: "Served in the Governor’s Office, participating in government coordination and administration.",
    current: false,
  },
  {
    year: "2023 – Present",
    title: "Senator, Federal Republic of Nigeria",
    note: "Represents Oyo Central Senatorial District in the 10th National Assembly.",
    current: true,
  },
];

/** Used when the database is unreachable and as the seed for a fresh install. */
export const DEFAULT_SETTINGS: SiteSettings = {
  contact: { email: SITE.email, phone: SITE.phone, office: SITE.office, hours: SITE.hours },
  socials: { facebook: "", instagram: "", x: "", linkedin: "", youtube: "" },
  home: {
    heroEyebrow: "Oyo Central · Seeking re-election, 2027",
    heroTitle: "Senator Dr Yunus Abiodun Akintunde",
    heroBody:
      "Senator Dr Yunus Abiodun Akintunde represents Oyo Central Senatorial District in the 10th Senate of the Federal Republic of Nigeria.",
    stats: [
      { n: "9,000+", l: "Solar streetlights installed" },
      { n: "89", l: "Solar-powered boreholes delivered" },
      { n: "7", l: "Bills sponsored and supported" },
      { n: "11", l: "Local governments, 118 wards" },
    ],
    quote:
      "In 2023, Oyo Central gave me a mandate on the strength of a promise. Today, I am asking for a second term on the strength of a record, and a plan to continue the good work we started together.",
    campaignVideoUrl: "",
    campaignVideoCaption: "Akintunde 2027 campaign film.",
    intro:
      "Since his election in 2023, he has pursued a programme of legislative representation, constituency development, infrastructure delivery, human capital development and political engagement. His work in the Senate combines lawmaking, oversight and institutional advocacy with interventions designed to address the needs of communities across the 11 local government areas of Oyo Central.\n\nAs Pioneer Chairman of the Senate Committee on South West Development Commission and Deputy Chairman of the Senate Committee on Police Affairs, Senator Akintunde participates in national legislative and policy discussions while maintaining a strong focus on the development priorities of his constituency.\n\nHis approach to representation is guided by the belief that public office should deliver practical benefits, strengthen institutions and create opportunities for people.",
    tagline: "Do More. Delivering representation through action.",
    focusHeading: "Key areas of focus",
    focusAreas: [
      "Legislative representation and lawmaking",
      "Education and institutional development",
      "Healthcare and medical interventions",
      "Roads and community infrastructure",
      "Water supply and solar-powered boreholes",
      "Solar streetlights and community security",
      "Youth and women empowerment",
      "Employment facilitation",
      "Agricultural support",
      "Political and community engagement",
    ],
    glanceHeading: "Constituency at a glance",
    glanceIntro:
      "Oyo Central Senatorial District comprises 11 local government areas and 118 wards.",
    featuredTitle: "Representation that reaches the people.",
    featuredBody:
      "From legislative advocacy in the National Assembly to projects and empowerment programmes in communities, Senator Akintunde’s work is focused on connecting public policy with the everyday needs of constituents.",
    legislativeUpdates: [
      {
        status: "",
        title: "Federal Medical Centres Act (Amendment) Bill, 2025 (SB.1017)",
        text: "Seeks to provide for the establishment of a 100-bed Mother and Child Hospital at Ona-Ara Local Government Area.",
      },
      {
        status: "",
        title: "Federal Polytechnic, Ayede (Establishment) Bill, 2025 (SB.859)",
        text: "Seeks to provide a statutory framework for the establishment of the Federal Polytechnic, Ayede.",
      },
      {
        status: "",
        title: "Federal University of Education (Special), Oyo (Establishment) Bill, 2024 (SB.67)",
        text: "Seeks to upgrade the Federal College of Education (Special), Oyo, into a Federal University of Education (Special).",
      },
      {
        status: "",
        title: "Pioneer Chairman, Senate Committee on South West Development Commission",
        text: "Also Deputy Chairman of the Senate Committee on Police Affairs.",
      },
    ],
    projectUpdates: [
      {
        status: "Ongoing",
        title: "Ayegun–Oleyo Road, Oluyole",
        text: "Rehabilitation of the 17-kilometre road.",
      },
      {
        status: "Ongoing",
        title: "Alabata Junction–Elekuru–Olaleye–Onibonla Village Road, Akinyele",
        text: "Rehabilitation to improve access and movement within the affected communities.",
      },
      {
        status: "Ongoing",
        title: "Ojongbodu erosion control and channelisation, Oyo West",
        text: "Works to address drainage and erosion challenges.",
      },
      {
        status: "Ongoing",
        title: "Irepo Market, Oyo",
        text: "Construction of an ultra-modern market.",
      },
      {
        status: "Ongoing",
        title: "4,200 additional solar-powered streetlights",
        text: "Under implementation across the district.",
      },
      {
        status: "Completed",
        title: "89 solar-powered boreholes",
        text: "Completed and delivered out of 120 promised.",
      },
    ],
    ctaTitle: "Stand with Senator Akintunde.",
    ctaBody:
      "Volunteer, join a ward team, reach the office in your local government, or stay in the loop as Oyo Central heads into 2027.",
    heroSlides: [
      {
        url: img.portraitWhite,
        alt: "Senator Dr Yunus Abiodun Akintunde, Oyo Central Senatorial District",
        focus: "center 20%",
      },
      {
        url: "/hero/hero-fist.jpg",
        alt: "Senator Akintunde raising a fist in solidarity",
        focus: "75% 25%",
      },
      {
        url: "/hero/hero-victory.jpg",
        alt: "Senator Akintunde giving the victory sign",
        focus: "75% 25%",
      },
      {
        url: "/hero/hero-interview.jpg",
        alt: "Senator Akintunde speaking to the press in Oyo Central",
        focus: "center 20%",
      },
    ],
  },
  footer: {
    topLine: "Senator Dr Yunus Abiodun Akintunde · Nigerian Senate · Oyo State · APC",
    blurb:
      "Committed to effective representation, legislative service and development across Oyo Central.",
    copyright:
      "© {year} Senator Dr Yunus Abiodun Akintunde · Oyo Central Senatorial District. All Rights Reserved",
    showEmblems: true,
  },
  header: {
    showTopBar: true,
    showPhone: true,
    showEmail: true,
    showSocials: true,
    followLabel: "Follow us",
    siteName: SITE.shortName,
    siteTagline: SITE.role,
    ctaLabel: "Contact",
    ctaHref: "/get-involved",
  },
  biography: {
    eyebrow: "Biography",
    title: "Senator Dr Yunus Abiodun Akintunde",
    intro:
      "Senator Dr Yunus Abiodun Akintunde is a Nigerian public servant, legislator and political leader representing Oyo Central Senatorial District in the 10th Senate of the Federal Republic of Nigeria.",
    showApcBadge: true,
    facts: [
      { n: "1962", l: "Born in Pakoyi, Oyo town" },
      { n: "Ph.D.", l: "Energy & Environmental Studies, UI" },
      { n: "2023", l: "Elected to the 10th Senate" },
      { n: "11", l: "Local government areas represented" },
    ],
    sections: BIO_SECTIONS,
    photoCaption: "Senator Dr Yunus Abiodun Akintunde, Oyo Central.",
    timelineHeading: "Public service and leadership profile",
    timeline: BIO_TIMELINE,
  },
  page_headers: {
    news: {
      eyebrow: "News and media",
      title: "News and Updates",
      lede: "News about Senator Akintunde’s legislative activities, constituency projects, official engagements, political assignments, community visits and development interventions.",
    },
    media: {
      eyebrow: "Photograph and video gallery",
      title: "Gallery",
      lede: "A visual record of Senate plenary and committee activities, constituency project inspections, community engagements, empowerment programmes, educational interventions, medical outreach, political engagements and meetings with stakeholders.",
    },
  },
  images: DEFAULT_IMAGES,
  news_page: {
    topics: [...NEWS_TOPICS],
    pressReleasesHeading: "Press releases and official statements",
    pressReleasesIntro:
      "Official statements, policy positions, public announcements, clarifications and media releases issued by Senator Akintunde’s office.",
    galleryHeading: "Photograph and video gallery",
    galleryIntro:
      "A visual record of Senator Akintunde’s work in the Senate, across Oyo Central and on the campaign trail.",
    photoTopics: [
      "Senate plenary and committee activities",
      "Constituency project inspections",
      "Community engagements",
      "Empowerment programmes",
      "Educational interventions",
      "Medical outreach activities",
      "Political and party engagements",
      "Meetings with public officials and stakeholders",
    ],
    videoTopics: [
      "Senate contributions and interviews",
      "Constituency project updates",
      "Public addresses",
      "Media appearances",
      "Community outreach programmes",
      "Empowerment and development activities",
    ],
    radioHeading: "Radio and television engagements",
    radioIntro:
      "Senator Akintunde participates in media engagements to discuss his legislative responsibilities, constituency development programmes and national issues. He sponsors the IGBALAYE radio programme on:",
    stations: [
      {
        name: "Dynasty FM, Oyo",
        text: "The programme reaches audiences in the Oyo and Ogbomoso zones.",
      },
      {
        name: "Agidigbo FM, Ibadan",
        text: "The programme provides a platform for engagement with listeners across the Ibadan metropolis.",
      },
    ],
    radioOutro:
      "The programme provides constituents with opportunities to communicate their concerns, requests, feedback and contributions.",
  },
  achievements: {
    pageTitle: "Major achievements in every local government",
    pageIntro:
      "Senator Akintunde’s constituency development programme covers education, healthcare, roads, water supply, electricity, security lighting, agriculture, market development, employment and social support.",
    overviewHeading: "An overview of constituency interventions",
    overview:
      "The interventions are spread across the 11 local government areas of Oyo Central, with attention to both community-level needs and projects capable of delivering wider public benefits.",
    record: [
      {
        heading: "Education",
        items: [
          "Renovation programme covering 23 public schools across Oyo Central.",
          "Construction of classroom blocks in several communities.",
          "Development of facilities at the Federal College of Education (Special), Oyo.",
          "Establishment of four ICT centres.",
          "Annual distribution of 100 UTME application forms.",
        ],
      },
      {
        heading: "Healthcare",
        items: [
          "Optical medical outreach reaching 3,680 beneficiaries across the 11 local government areas.",
          "Facilitation of 350 medical slots through Federal Government channels, alongside additional beneficiaries.",
          "Sponsorship of 10 special cases for surgery.",
          "Construction of a 20-bed Primary Healthcare Centre and renovation of an existing facility at Isokun, Oyo West.",
          "Provision of sanitary facilities at Pakoyi Health Centre, Oyo West.",
        ],
      },
      {
        heading: "Water supply",
        items: [
          "Solar-powered borehole programme covering the 118 wards of Oyo Central and additional strategic locations.",
          "89 boreholes completed and delivered out of 120 promised.",
        ],
      },
      {
        heading: "Solar streetlighting",
        items: [
          "More than 9,000 solar-powered streetlights installed across Oyo Central.",
          "An additional 4,200 solar-powered streetlights under implementation.",
          "A security lighting component covering police formations and other public facilities.",
        ],
      },
      {
        heading: "Roads and infrastructure",
        items: [
          "Ongoing rehabilitation of the 17-kilometre Ayegun–Oleyo Road in Oluyole.",
          "Ongoing rehabilitation of the Alabata Junction–Elekuru–Olaleye–Onibonla Village Road in Akinyele.",
          "Ongoing erosion control and channelisation at Ojongbodu, Oyo West.",
          "Other road projects awarded across the district.",
        ],
      },
      {
        heading: "Human capital development",
        items: [
          "Training and empowerment of tailors, ICT participants, phone repairers and other artisans.",
          "Distribution of equipment to women, mechanics, welders and other beneficiaries.",
          "Agricultural inputs and equipment for farmers.",
          "Employment facilitation across federal institutions.",
        ],
      },
    ],
    stats: [
      { n: "9,000+", l: "Solar streetlights installed" },
      { n: "89", l: "Solar-powered boreholes delivered" },
      { n: "3,680", l: "Optical outreach beneficiaries" },
      { n: "74", l: "Federal job placements" },
    ],
    tagline: "Let's do more",
    portrait: "/brand/support-portrait.jpg",
  },
};

export function mergeSettings(
  rows: { key: string; value: unknown }[] | null | undefined,
): SiteSettings {
  const out: SiteSettings = structuredClone(DEFAULT_SETTINGS);
  for (const row of rows ?? []) {
    if (
      row.key === "contact" ||
      row.key === "socials" ||
      row.key === "home" ||
      row.key === "footer" ||
      row.key === "header" ||
      row.key === "biography" ||
      row.key === "images" ||
      row.key === "achievements" ||
      row.key === "news_page"
    ) {
      // Empty strings mean "use the default" so a cleared field never blanks the site.
      const clean = Object.fromEntries(
        Object.entries((row.value ?? {}) as Record<string, unknown>).filter(
          ([, v]) => v !== "" && v != null,
        ),
      );
      Object.assign(out[row.key], clean);
    }
  }
  // Page headings: merge field by field so a cleared field falls back to the default.
  const ph = rows?.find((r) => r.key === "page_headers")?.value as
    Partial<Record<keyof PageHeadings, Partial<PageHeading>>> | undefined;
  for (const k of ["news", "media"] as const) {
    const v = ph?.[k] ?? {};
    out.page_headers[k] = {
      ...DEFAULT_SETTINGS.page_headers[k],
      ...Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === "string" && x.trim())),
    };
  }
  out.home.heroSlides = (out.home.heroSlides ?? [])
    .filter((s) => s?.url)
    .map((s) => ({ ...s, url: siteUrl(s.url) }));
  for (const k of Object.keys(out.images) as (keyof ImageSettings)[])
    out.images[k] = siteUrl(out.images[k]);
  out.achievements.portrait = siteUrl(out.achievements.portrait);
  out.home.campaignVideoUrl = siteUrl(out.home.campaignVideoUrl);
  out.home.campaignVideoPoster = siteUrl(out.home.campaignVideoPoster ?? "");
  if (out.home.heroSlides.length === 0) out.home.heroSlides = DEFAULT_SETTINGS.home.heroSlides;
  for (const k of ["focusAreas", "legislativeUpdates", "projectUpdates"] as const)
    if (!Array.isArray(out.home[k]))
      (out.home as Record<string, unknown>)[k] = DEFAULT_SETTINGS.home[k];
  if (!Array.isArray(out.home.stats) || out.home.stats.length === 0)
    out.home.stats = DEFAULT_SETTINGS.home.stats;
  return out;
}
