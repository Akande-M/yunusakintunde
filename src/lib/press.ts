import { db } from "@/lib/db";

/** A news article (or video) about the Senator on another website, shown as a preview card. */
export type PressLink = {
  url: string;
  title: string;
  source: string;
  /** yyyy-mm-dd when known. */
  date: string;
  image: string;
  summary: string;
  /** One of the News & Media categories; empty = worked out from the headline. */
  topic?: string;
};

/** Best guess of a story's category from its headline, used when none is set. */
const TOPIC_RULES: [string, RegExp][] = [
  [
    "Press Releases and Official Statements",
    /statement|press release|condol|congratulat|felicitat|commends|urged|condemn/i,
  ],
  [
    "Legislative Bills and Motions",
    /\bbill\b|motion|legislat|public hearing|upgrade|budget|passes/i,
  ],
  ["Employment Facilitation", /\bjobs?\b|employ|recruit|placement/i],
  [
    "Education and Healthcare",
    /school|educat|student|utme|health|medical|hospital|optical|universit|college/i,
  ],
  ["Youth and Women Empowerment", /empower|youth|women|skill|training|laptop|grant|farmers?/i],
  [
    "Constituency Projects",
    /project|road|borehole|streetlight|classroom|commission|market|transformer|days in office|years in office/i,
  ],
  ["Senate Activities", /senate|plenary|committee|chamber|security/i],
  [
    "Political and Party Engagements",
    /\bapc\b|party|rally|campaign|election|2027|rivals|politic|analyst|consolidation|cap fits|clarion|agility|leadership|governance|master planner|good listener|doing more/i,
  ],
  ["Official Visits and Meetings", /visit|meet|courtesy|receives|hosts|delegation/i],
];

export function topicOf(it: Pick<PressLink, "title" | "topic">): string {
  if (it.topic) return it.topic;
  return TOPIC_RULES.find(([, re]) => re.test(it.title))?.[0] ?? "Official Visits and Meetings";
}

export const PRESS_KEY = "press_links";

const SOURCES: Record<string, string> = {
  "punchng.com": "Punch",
  "tribuneonlineng.com": "Nigerian Tribune",
  "africanotrumpeters.com": "Africano Trumpeters",
  "dailytimesng.com": "Daily Times",
  "freshpage.com.ng": "Freshpage",
  "thenationonlineng.net": "The Nation",
  "oyoinsight.com": "Oyo Insight",
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "facebook.com": "Facebook",
  "vanguardngr.com": "Vanguard",
  "guardian.ng": "The Guardian",
  "premiumtimesng.com": "Premium Times",
  "channelstv.com": "Channels TV",
  "thisdaylive.com": "ThisDay",
  "dailytrust.com": "Daily Trust",
  "leadership.ng": "Leadership",
};

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^(www|m|amp)\./, "");
  } catch {
    return "";
  }
}

export function sourceOf(url: string): string {
  const h = hostOf(url);
  return SOURCES[h] ?? h;
}

/** A readable title from the link itself, used until the real headline is fetched. */
export function titleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter((p) => p && p !== "amp" && !/^\d+$/.test(p));
    if (parts[0] === "tag" && parts[1])
      return `More coverage: ${parts[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`;
    const slug = parts[parts.length - 1] ?? "";
    if (!slug || /watch/.test(slug)) return `${sourceOf(url)} video`;
    const t = slug.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  } catch {
    return url;
  }
}

/** Canonical form for spotting the same article twice (ignores ?amp, /amp/ and trailing slash). */
export function canonicalUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    u.search = u.hostname.includes("youtube") ? `?v=${u.searchParams.get("v") ?? ""}` : "";
    u.pathname = u.pathname.replace(/\/amp\/?$/, "/").replace(/\/+$/, "");
    u.hostname = u.hostname.replace(/^(www|m|amp)\./, "");
    return u.toString();
  } catch {
    return url.trim();
  }
}

export function youtubeIdOf(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return m ? m[1]! : null;
}

export function normalizePress(v: unknown): PressLink[] {
  const list = Array.isArray(v)
    ? v
    : Array.isArray((v as { items?: unknown })?.items)
      ? (v as { items: unknown[] }).items
      : [];
  return list
    .map((x) => x as Partial<PressLink>)
    .filter((x) => typeof x.url === "string" && /^https?:\/\//.test(x.url))
    .map((x) => ({
      url: x.url!,
      title: String(x.title || titleFromUrl(x.url!)),
      source: String(x.source || sourceOf(x.url!)),
      date: String(x.date ?? ""),
      image: String(x.image ?? ""),
      summary: String(x.summary ?? ""),
      topic: String(x.topic ?? ""),
    }));
}

export async function getPressLinks(): Promise<PressLink[]> {
  try {
    const { data, error } = await db
      .from("site_settings")
      .select("value")
      .eq("key", PRESS_KEY)
      .maybeSingle();
    if (error) throw error;
    return normalizePress((data as { value: unknown } | null)?.value);
  } catch (err) {
    console.warn("[cms] press links", err);
    return [];
  }
}

export async function savePressLinks(items: PressLink[]) {
  const { error } = await db
    .from("site_settings")
    .upsert({ key: PRESS_KEY, value: { items } }, { onConflict: "key" });
  if (error) throw error;
}
