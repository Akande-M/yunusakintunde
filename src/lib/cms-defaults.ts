import { SITE, img } from "@/lib/site-data";
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
  heroSlides: HeroSlide[];
};

export type FooterSettings = {
  topLine: string;
  blurb: string;
  copyright: string; // {year} is replaced with the current year
  showEmblems: boolean;
};

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
    default: "/hero/hero-fist.jpg",
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

/** The default support photo is wide with the face on the right; keep it in the circle. */
export const DEFAULT_SUPPORT_PHOTO_FOCUS_X = 0.78;

export type ImageKey = (typeof IMAGE_SLOTS)[number]["key"];
export type ImageSettings = Record<ImageKey, string>;

export type SiteSettings = {
  contact: ContactSettings;
  socials: SocialSettings;
  home: HomeSettings;
  footer: FooterSettings;
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
    heroTitle:
      "Four years of delivery. Now, I'm asking Oyo Central to let us continue the good work.",
    heroBody:
      "Senator Yunus Abiodun Akintunde, PhD, is the sitting Senator for Oyo Central Senatorial District, asking for a second term on the strength of 38 delivered projects, 6 sponsored bills, and a promise-tracker that shows exactly what has been kept.",
    stats: [
      { n: "38", l: "Projects delivered" },
      { n: "12", l: "LGAs & wards reached" },
      { n: "6", l: "Bills sponsored" },
      { n: "100%", l: "2023 promises delivered" },
    ],
    quote:
      "In 2023, Oyo Central gave me a mandate on the strength of a promise. Today, I am asking for a second term on the strength of a record, and a plan to continue the good work we started together.",
    campaignVideoUrl: "",
    campaignVideoCaption: "Headline campaign video: “Four years of delivery”, Akintunde 2027.",
    heroSlides: [
      {
        url: img.portraitWhite,
        alt: "Senator Yunus Abiodun Akintunde, PhD, Oyo Central Senatorial District",
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
    topLine: "Senator Yunus Abiodun Akintunde, PhD · Nigerian Senate · Oyo State · APC",
    blurb:
      "Official website of Senator Yunus Abiodun Akintunde, PhD, seeking re-election for Oyo Central Senatorial District in 2027.",
    copyright:
      "© {year} Senator Yunus Abiodun Akintunde, PhD · Oyo Central Senatorial District. All Rights Reserved",
    showEmblems: true,
  },
  images: DEFAULT_IMAGES,
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
      row.key === "images"
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
  out.home.heroSlides = (out.home.heroSlides ?? []).filter((s) => s?.url);
  if (out.home.heroSlides.length === 0) out.home.heroSlides = DEFAULT_SETTINGS.home.heroSlides;
  if (!Array.isArray(out.home.stats) || out.home.stats.length === 0)
    out.home.stats = DEFAULT_SETTINGS.home.stats;
  return out;
}
