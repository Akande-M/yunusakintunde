import { SITE } from "@/lib/site-data";

/** Shapes of the editable "Site content" settings (stored in public.site_settings). */
export type ContactSettings = { email: string; phone: string; office: string; hours: string };
export type SocialSettings = {
  facebook: string;
  instagram: string;
  x: string;
  linkedin: string;
  youtube: string;
};
export type HomeSettings = {
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  stats: { n: string; l: string }[];
  quote: string;
  campaignVideoUrl: string;
  campaignVideoCaption: string;
};
export type SiteSettings = {
  contact: ContactSettings;
  socials: SocialSettings;
  home: HomeSettings;
};

/** Used when the database is unreachable and as the seed for a fresh install. */
export const DEFAULT_SETTINGS: SiteSettings = {
  contact: { email: SITE.email, phone: SITE.phone, office: SITE.office, hours: SITE.hours },
  socials: { facebook: "", instagram: "", x: "", linkedin: "", youtube: "" },
  home: {
    heroEyebrow: "Oyo Central · Seeking re-election, 2027",
    heroTitle:
      "Four years of delivery. Now, I'm asking Oyo Central to let us continue the good work.",
    heroBody:
      "Senator Yunus Abiodun Akintunde, PhD, is the sitting Senator for Oyo Central Senatorial District — asking for a second term on the strength of 38 delivered projects, 6 sponsored bills, and a promise-tracker that shows exactly what has been kept.",
    stats: [
      { n: "38", l: "Projects delivered" },
      { n: "12", l: "LGAs & wards reached" },
      { n: "6", l: "Bills sponsored" },
      { n: "100%", l: "2023 promises delivered" },
    ],
    quote:
      "In 2023, Oyo Central gave me a mandate on the strength of a promise. Today, I am asking for a second term on the strength of a record — and a plan to continue the good work we started together.",
    campaignVideoUrl: "",
    campaignVideoCaption: "Headline campaign video: “Four years of delivery” — Akintunde 2027.",
  },
};

export function mergeSettings(
  rows: { key: string; value: unknown }[] | null | undefined,
): SiteSettings {
  const out: SiteSettings = structuredClone(DEFAULT_SETTINGS);
  for (const row of rows ?? []) {
    if (row.key === "contact" || row.key === "socials" || row.key === "home") {
      Object.assign(out[row.key], (row.value ?? {}) as object);
    }
  }
  if (!Array.isArray(out.home.stats) || out.home.stats.length === 0)
    out.home.stats = DEFAULT_SETTINGS.home.stats;
  return out;
}
