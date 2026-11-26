import { db } from "@/lib/db";
import { hostBundledImages } from "@/lib/bundled-images";

/*
 * Seven photos of the Senator with national leaders, added as a gallery at the end of the
 * Stakeholder Engagements tab on the Political Leadership & Party Engagement page.
 */

const SLUG = "political-leadership-and-party-engagement";
const TAB = "Stakeholder Engagements";
const HEADING = "With National Leaders";
const D = "/site-images/stakeholders/";

const IMAGES = [
  {
    url: `${D}01-with-late-president-buhari.jpg#shape=portrait`,
    caption: "With late President Muhammadu Buhari",
  },
  { url: `${D}02-with-president-tinubu.jpg`, caption: "With President Bola Ahmed Tinubu" },
  {
    url: `${D}03-with-senator-wamakko.jpg#shape=portrait`,
    caption: "With former Governor of Sokoto State, Senator Aliyu Wamakko",
  },
  {
    url: `${D}04-with-first-lady-remi-tinubu.jpg#shape=portrait`,
    caption: "With First Lady, Senator Oluremi Tinubu",
  },
  {
    url: `${D}05-with-president-tinubu.jpg#shape=portrait`,
    caption: "With President Bola Ahmed Tinubu",
  },
  { url: `${D}06-with-president-tinubu.jpg`, caption: "With President Bola Ahmed Tinubu" },
  { url: `${D}07-with-president-tinubu.jpg`, caption: "With President Bola Ahmed Tinubu" },
];

type Sec = Record<string, unknown> & { type: string; tab?: string; heading?: string };

export async function applyNationalLeaders(progress: (msg: string) => void) {
  progress("Adding the photos with national leaders to Stakeholder Engagements…");
  const { data, error } = await db
    .from("site_pages")
    .select("sections")
    .eq("slug", SLUG)
    .maybeSingle();
  if (error) throw error;
  const secs = ((data as { sections: unknown } | null)?.sections ?? null) as Sec[] | null;
  if (!Array.isArray(secs)) throw new Error("The Political Leadership page wasn't found.");
  if (secs.some((s) => s.type === "gallery" && s["heading"] === HEADING)) return;

  const gallery: Sec = { type: "gallery", tab: TAB, heading: HEADING, images: IMAGES };
  // Put it after the last Stakeholder Engagements section, so it shows at the end of that tab.
  let at = -1;
  secs.forEach((s, i) => {
    if (s.tab === TAB) at = i;
  });
  const next =
    at >= 0 ? [...secs.slice(0, at + 1), gallery, ...secs.slice(at + 1)] : [...secs, gallery];

  const res = await db
    .from("site_pages")
    .update({ sections: await hostBundledImages(next) })
    .eq("slug", SLUG);
  if (res.error) throw res.error;
}
