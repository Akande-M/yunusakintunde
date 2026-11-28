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
  /** Line under the key figures; the office asked for no engagement count until records exist. */
  engagementLine?: string;
  /** "The record at a glance" tiles under the manifesto scorecard. */
  glanceTiles?: GlanceTile[];
};

/** One tile: headline figure (n), area (l), short note and the page it links to. */
export type GlanceTile = { n: string; l: string; note: string; href: string };

export const DEFAULT_GLANCE_TILES: GlanceTile[] = [
  {
    l: "Legislative representation",
    n: "7 bills",
    note: "Sponsored and supported in the 10th Senate",
    href: "/bills-and-motions",
  },
  {
    l: "Education",
    n: "4 ICT centres",
    note: "Plus classroom blocks and a 23-school renovation programme",
    href: "/infrastructure-projects#tab-education",
  },
  {
    l: "Healthcare",
    n: "3,680",
    note: "Eye outreach beneficiaries across 11 local governments",
    href: "/outreach",
  },
  {
    l: "Road infrastructure",
    n: "3 ongoing",
    note: "Road and erosion projects, with 12 more awarded",
    href: "/infrastructure-projects#tab-roads-infrastructure",
  },
  {
    l: "Water supply",
    n: "89 of 120",
    note: "Solar-powered boreholes delivered",
    href: "/infrastructure-projects#tab-water-solar-lighting",
  },
  {
    l: "Solar lighting",
    n: "9,000+",
    note: "Solar streetlights installed; 4,200 more under way",
    href: "/infrastructure-projects#tab-water-solar-lighting",
  },
  {
    l: "Employment & skills",
    n: "74 jobs",
    note: "Federal placements, plus training for over 1,300 people",
    href: "/skills-jobs-and-empowerment#tab-jobs-human-capital",
  },
  {
    l: "Agriculture & empowerment",
    n: "7,200",
    note: "Bags of NPK fertiliser, plus a ₦25 million traders’ grant",
    href: "/skills-jobs-and-empowerment#tab-agriculture",
  },
  {
    l: "Community & political engagement",
    n: "11 LGAs",
    note: "Regular constituency engagements across every local government",
    href: "/political-leadership-and-party-engagement",
  },
  {
    l: "Projects & programmes",
    n: "{projects}",
    note: "Recorded across the 11 local governments",
    href: "/achievements",
  },
];

export const DEFAULT_ENGAGEMENT_LINE =
  "Regular constituency engagements across the 11 local government areas of Oyo Central Senatorial District.";

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
};

const DEFAULT_IMAGES = Object.fromEntries(
  IMAGE_SLOTS.map((s) => [s.key, s.default]),
) as ImageSettings;

/** Used when the database is unreachable and as the seed for a fresh install. */
export const DEFAULT_SETTINGS: SiteSettings = {
  contact: { email: SITE.email, phone: SITE.phone, office: SITE.office, hours: SITE.hours },
  socials: { facebook: "", instagram: "", x: "", linkedin: "", youtube: "" },
  home: {
    heroEyebrow: "Oyo Central · Seeking re-election, 2027",
    heroTitle: "Do More. Delivering representation through action.",
    heroBody:
      "Senator Dr Yunus Abiodun Akintunde represents Oyo Central Senatorial District in the 10th Senate of the Federal Republic of Nigeria, combining lawmaking, oversight and institutional advocacy with interventions across the 11 local government areas of Oyo Central.",
    stats: [
      { n: "11", l: "Local governments" },
      { n: "{projects}", l: "Projects & programmes" },
      { n: "9,000+", l: "Solar streetlights installed" },
      { n: "3,680", l: "Optical outreach beneficiaries" },
    ],
    quote:
      "In 2023, Oyo Central gave me a mandate on the strength of a promise. Today, I am asking for a second term on the strength of a record, and a plan to continue the good work we started together.",
    campaignVideoUrl: "",
    campaignVideoCaption: "Headline campaign video: “Four years of delivery”, Akintunde 2027.",
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
      "Official website of Senator Dr Yunus Abiodun Akintunde, seeking re-election for Oyo Central Senatorial District in 2027.",
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
    ctaLabel: "Get in touch",
    ctaHref: "/get-involved",
  },
  biography: {
    eyebrow: "Biography",
    title: "Senator Dr Yunus Abiodun Akintunde",
    intro:
      "Senator Dr Yunus Abiodun Akintunde is a Nigerian legislator, author and energy economist representing Oyo Central Senatorial District in the 10th National Assembly.",
    showApcBadge: true,
    facts: [
      { n: "1962", l: "Born in Pakoyi, Oyo town" },
      { n: "Ph.D.", l: "Energy & Environmental Studies, UI" },
      { n: "2002", l: "Founded Trade Codes Limited" },
      { n: "APC", l: "All Progressives Congress candidate" },
    ],
    sections: [
      {
        heading: "Early life & education",
        body: "Born 6 March 1962 in Onikanko Compound, Pakoyi, Oyo town. Educated at Ansar-ud-deen Model Primary School, Balogun Oyo, and Oranyan Grammar School, Oyo.\n\nHe holds an OND and a BSc in Physics (The Polytechnic, Ibadan and Lagos State University), an MSc in Public Administration and an MSc in Energy Studies (LASU), and a Ph.D. in Energy and Environmental Studies from the University of Ibadan. He is the first Nigerian to hold that doctorate.",
      },
      {
        heading: "Business & public service",
        body: "MD/CEO of Trade Codes Limited, founded in 2002, which has created over 30 permanent jobs and empowered more than 300 people across infrastructure delivery, energy advisory and upskilling. That operating experience shapes how the constituency office is run today: projects scoped, costed, delivered and reported back.",
      },
    ],
    photoCaption: "Senator Dr Yunus Abiodun Akintunde, Oyo Central.",
    timelineHeading: "Timeline of public service",
    timeline: [
      {
        year: "1999 – 2003",
        title: "Commissioner, Oyo State Civil Service Commission",
        note: "",
        current: false,
      },
      {
        year: "2011 – 2012",
        title: "Commissioner for Works & Transport, Oyo State",
        note: "",
        current: false,
      },
      {
        year: "2014 – 2015",
        title: "Executive Assistant to the Governor of Oyo State",
        note: "",
        current: false,
      },
      {
        year: "2015 – 2023",
        title: "Private sector & community development",
        note: "Trade Codes Limited, energy advisory and grassroots empowerment work.",
        current: false,
      },
      {
        year: "2023 – Present",
        title: "Senator, Oyo Central Senatorial District",
        note: "10th National Assembly. Seeking re-election in 2027.",
        current: true,
      },
    ],
  },
  page_headers: {
    news: {
      eyebrow: "News & campaign trail",
      title: "News & Updates",
      lede: "Senate business, constituency work, and campaign-trail activity as 2027 approaches, all in one place.",
    },
    media: {
      eyebrow: "Photos & video",
      title: "Photos ofIn office, on the campaign trail",
      lede: "Photos of projects, official duties, and more.",
    },
  },
  images: DEFAULT_IMAGES,
  achievements: {
    pageTitle: "Major achievements in every local government",
    pageIntro:
      "Every project delivered across Oyo Central, local government by local government, plus the Senator's work on the floor of the Senate.",
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
      row.key === "achievements"
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
  if (!Array.isArray(out.home.stats) || out.home.stats.length === 0)
    out.home.stats = DEFAULT_SETTINGS.home.stats;
  return out;
}
