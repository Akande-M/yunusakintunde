import { format } from "date-fns";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/asset-url";
import {
  AGENDA_2027,
  ENDORSEMENTS,
  GALLERY,
  GALLERY_FILTERS,
  NEWS,
  PROJECTS,
  PROMISES_KEPT,
  type Commitment,
  type GalleryCategory,
  type Project,
} from "@/lib/site-data";
import { STATIC_ARTICLES } from "@/lib/static-articles";
import { ACHIEVEMENTS, normalizeItems, type AchievementCard } from "@/lib/achievements-data";
import { normalizeSections } from "@/lib/pages";
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from "@/lib/cms-defaults";

/*
 * Public read layer for the CMS.
 * - Always filters to published rows explicitly (a logged-in editor browsing the
 *   public site must never see drafts, even though RLS would allow it).
 * - If the database can't be reached (e.g. before the migration runs), falls back
 *   to the original hardcoded content so the site never goes blank.
 */

export type NewsCardData = {
  date: string;
  category: string;
  title: string;
  summary: string;
  image: string;
  alt: string;
  slug?: string | undefined;
};

export type ArticleData = {
  title: string;
  date: string;
  category: string;
  hero: string;
  heroAlt: string;
  paragraphs: string[];
  photos: { url: string; alt: string; caption: string }[];
};

export type GalleryView = {
  id: string;
  kind: "image" | "youtube" | "video";
  url: string;
  thumb: string;
  alt: string;
  caption: string;
  category: GalleryCategory;
  archived: boolean;
};

/** A photo or video on the Media page; page photos are grouped into tabs named after their page. */
export type MediaItem = Omit<GalleryView, "category"> & { category: string };

/** Template stock pictures from the first build: never shown as real photos. */
export const STOCK_IMAGES = [
  "/site-images/senate.jpg",
  "/site-images/solar-night.jpg",
  "/site-images/medical.jpg",
  "/site-images/skills.jpg",
  "/site-images/ict-hub.jpg",
  "/site-images/townhall.jpg",
];
export const isStock = (url: string) => STOCK_IMAGES.some((s) => url.split("#")[0]!.endsWith(s));

/** Which Media tab each page's photos go under. Other pages use their own title. */
const PAGE_TABS: Record<string, string> = {
  "bills-and-motions": "In the Senate",
  "committees-and-oversight": "Committees & Oversight",
  recognition: "Recognition & Awards",
  "infrastructure-projects": "Infrastructure",
  "constituency-interventions-and-development-projects": "Infrastructure",
  outreach: "Outreach",
  "skills-jobs-and-empowerment": "Skills & Empowerment",
  "political-leadership-and-party-engagement": "Political Leadership",
  "constituency-engagements": "Political Leadership",
  "campaigns-and-mobilisation": "Political Leadership",
  "stakeholder-engagements": "Political Leadership",
  "oversight-and-institutional-engagement": "Committees & Oversight",
};
const TAB_ORDER = [
  "In the Senate",
  "Committees & Oversight",
  "Recognition & Awards",
  "Infrastructure",
  "Outreach",
  "Skills & Empowerment",
  "Political Leadership",
  "Biography",
];

/**
 * Everything for the Media page: the photos and videos added in Admin → Media gallery page,
 * plus every photo used on the website's pages and achievement cards, so nothing uploaded
 * anywhere is missing. Each photo appears once.
 */
export async function getMediaLibrary(): Promise<{ items: MediaItem[]; tabs: string[] }> {
  const own = (await getGallery()).filter((g) => !isStock(g.url));
  // Same photo = same file name, ignoring the frame setting and the upload's random prefix.
  const keyOf = (u: string) =>
    (siteUrl(u).split("#")[0]!.split("/").pop() ?? "").replace(/^[0-9a-f]{8}-/, "");
  const seen = new Set(own.map((g) => keyOf(g.url)));
  const extra: MediaItem[] = [];
  const add = (url: string, caption: string, category: string) => {
    const key = keyOf(url);
    if (!url || seen.has(key) || isStock(url)) return;
    seen.add(key);
    extra.push({
      id: `p${extra.length}`,
      kind: "image",
      url: siteUrl(url),
      thumb: siteUrl(url),
      alt: caption,
      caption,
      category,
      archived: false,
    });
  };
  try {
    const [pages, cards] = await Promise.all([
      db
        .from("site_pages")
        .select("slug,title,hero_image,hero_alt,sections")
        .eq("status", "published"),
      getAchievements(),
    ]);
    const rows = (pages.data ?? []) as {
      slug: string;
      title: string;
      hero_image: string | null;
      hero_alt: string | null;
      sections: unknown;
    }[];
    for (const p of rows) {
      const tab = PAGE_TABS[p.slug] ?? p.title;
      const where = (lga?: string) => (lga ? ` (${lga})` : "");
      for (const sec of normalizeSections(p.sections)) {
        if (sec.type === "gallery")
          for (const im of sec.images)
            add(im.url, (im.caption || sec.heading) + where(sec.lga), tab);
        if ((sec.type === "text" || sec.type === "list" || sec.type === "cards") && sec.image)
          add(sec.image, (sec.caption || sec.heading) + where(sec.lga), tab);
        if (sec.type === "text" && sec.image2)
          add(sec.image2, (sec.caption2 || sec.heading) + where(sec.lga), tab);
        if (sec.type === "cards")
          for (const c of sec.items) if (c.image) add(c.image, c.title + where(sec.lga), tab);
      }
      if (p.hero_image) add(p.hero_image, p.hero_alt || p.title, tab);
    }
    const bio = await db.from("site_settings").select("value").eq("key", "biography").maybeSingle();
    const bioSecs = ((bio.data as { value?: { sections?: unknown } } | null)?.value?.sections ??
      []) as { heading?: string; image?: string; caption?: string }[];
    if (Array.isArray(bioSecs))
      for (const b of bioSecs)
        if (b?.image) add(b.image, b.caption || b.heading || "Biography", "Biography");
    for (const c of cards)
      for (const it of [...c.items, ...c.extraItems])
        if (it.image)
          add(
            it.image,
            `${c.title.replace(/ Local Government$/, "")}: ${it.text}`,
            "Local governments",
          );
  } catch (err) {
    console.warn("[cms] media library", err);
  }
  const items = [...extra, ...own];
  const present = new Set(items.map((i) => i.category));
  const tabs = [
    "All",
    ...TAB_ORDER.filter((t) => present.has(t)),
    ...[...present].filter((t) => !TAB_ORDER.includes(t) && !GALLERY_FILTERS.includes(t as never)),
    ...GALLERY_FILTERS.filter((t) => t !== "All" && (present.has(t) || t === "Videos")),
  ];
  return { items, tabs };
}

export type RecordData = { kept: Commitment[]; agenda: Commitment[]; projects: Project[] };
export type EndorsementView = { quote: string; name: string; role: string };

const PLACEHOLDER_IMG = "/favicon.ico";

async function safe<T>(label: string, run: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    console.warn(`[cms] ${label}: using built-in fallback content`, err);
    return fallback();
  }
}

function must<T>(res: { data: unknown; error: unknown }): T {
  if (res.error) throw res.error;
  return (res.data ?? []) as T;
}

export function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1]! : null;
}

export function youtubeThumb(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

const cardDate = (iso: string) => format(new Date(iso), "MMM dd, yyyy");
const longDate = (iso: string) => format(new Date(iso), "MMMM d, yyyy");

// ---------------------------------------------------------------- news
type NewsRow = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  body: string;
  hero_image_url: string | null;
  hero_alt: string;
  photos: { url: string; alt: string; caption: string }[] | null;
  published_at: string;
};

const nowIso = () => new Date().toISOString();

export function getNewsList(limit?: number): Promise<NewsCardData[]> {
  return safe(
    "news",
    async () => {
      let query = db
        .from("news_posts")
        .select("slug,title,summary,category,body,hero_image_url,hero_alt,published_at")
        .eq("status", "published")
        .lte("published_at", nowIso())
        .order("published_at", { ascending: false });
      if (limit) query = query.limit(limit);
      const rows = must<NewsRow[]>(await query);
      return rows.map((r): NewsCardData => ({
        date: cardDate(r.published_at),
        category: r.category,
        title: r.title,
        summary: r.summary,
        image: siteUrl(r.hero_image_url) || PLACEHOLDER_IMG,
        alt: r.hero_alt,
        slug: r.body.trim() ? r.slug : undefined,
      }));
    },
    () => (limit ? NEWS.slice(0, limit) : NEWS),
  );
}

export function getArticle(slug: string): Promise<ArticleData | null> {
  const fallback = (): ArticleData | null => STATIC_ARTICLES[slug] ?? null;
  return safe(
    "article",
    async () => {
      const res = await db
        .from("news_posts")
        .select("slug,title,summary,category,body,hero_image_url,hero_alt,photos,published_at")
        .eq("slug", slug)
        .eq("status", "published")
        .lte("published_at", nowIso())
        .maybeSingle();
      if (res.error) throw res.error;
      const r = res.data as NewsRow | null;
      if (!r || !r.body.trim()) return null;
      return {
        title: r.title,
        date: longDate(r.published_at),
        category: r.category,
        hero: siteUrl(r.hero_image_url) || PLACEHOLDER_IMG,
        heroAlt: r.hero_alt,
        paragraphs: toParagraphs(r.body),
        photos: Array.isArray(r.photos)
          ? r.photos.filter((p) => p?.url).map((p) => ({ ...p, url: siteUrl(p.url) }))
          : [],
      };
    },
    fallback,
  );
}

// ---------------------------------------------------------------- gallery
type GalleryRow = {
  id: string;
  kind: GalleryView["kind"];
  url: string;
  thumbnail_url: string | null;
  alt: string;
  caption: string;
  category: GalleryCategory;
  archived: boolean;
};

export function getGallery(): Promise<GalleryView[]> {
  return safe(
    "gallery",
    async () => {
      const rows = must<GalleryRow[]>(
        await db
          .from("gallery_items")
          .select("id,kind,url,thumbnail_url,alt,caption,category,archived")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
      );
      return rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        url: siteUrl(r.url),
        thumb:
          r.kind === "youtube"
            ? siteUrl(r.thumbnail_url) || youtubeThumb(r.url) || PLACEHOLDER_IMG
            : r.kind === "video"
              ? siteUrl(r.thumbnail_url) || ""
              : siteUrl(r.url),
        alt: r.alt,
        caption: r.caption,
        category: r.category,
        archived: r.archived,
      }));
    },
    () =>
      GALLERY.map((g, i) => ({
        id: String(i),
        kind: "image" as const,
        url: g.image,
        thumb: g.image,
        alt: g.alt,
        caption: g.caption,
        category: g.category,
        archived: !!g.archived,
      })),
  );
}

// ---------------------------------------------------------------- record
type CommitmentRow = {
  list: "kept" | "agenda";
  title: string;
  detail: string;
  status: Commitment["status"];
  status_label: string | null;
};
type ProjectRow = {
  name: string;
  place: string;
  region: Project["region"];
  completed_label: string;
  image_url: string | null;
  alt: string;
  night: boolean;
};

export function getRecord(): Promise<RecordData> {
  return safe(
    "record",
    async () => {
      const [c, p] = await Promise.all([
        db
          .from("commitments")
          .select("list,title,detail,status,status_label")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        db
          .from("projects")
          .select("name,place,region,completed_label,image_url,alt,night")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
      ]);
      const commitments = must<CommitmentRow[]>(c);
      const projects = must<ProjectRow[]>(p);
      const toC = (r: CommitmentRow): Commitment => ({
        title: r.title,
        detail: r.detail,
        status: r.status,
        ...(r.status_label ? { statusLabel: r.status_label } : {}),
      });
      return {
        kept: commitments.filter((r) => r.list === "kept").map(toC),
        agenda: commitments.filter((r) => r.list === "agenda").map(toC),
        projects: projects.map((r) => ({
          name: r.name,
          place: r.place,
          region: r.region,
          completed: r.completed_label,
          image: siteUrl(r.image_url) || PLACEHOLDER_IMG,
          alt: r.alt,
          ...(r.night ? { night: true } : {}),
        })),
      };
    },
    () => ({ kept: PROMISES_KEPT, agenda: AGENDA_2027, projects: PROJECTS }),
  );
}

// ---------------------------------------------------------------- endorsements & settings
export function getEndorsements(): Promise<EndorsementView[]> {
  return safe(
    "endorsements",
    async () =>
      must<EndorsementView[]>(
        await db
          .from("endorsements")
          .select("quote,name,role")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
    () => ENDORSEMENTS,
  );
}

export function getSettings(): Promise<SiteSettings> {
  return safe(
    "settings",
    async () =>
      mergeSettings(
        must<{ key: string; value: unknown }[]>(await db.from("site_settings").select("key,value")),
      ),
    () => structuredClone(DEFAULT_SETTINGS),
  );
}

// ---------------------------------------------------------------- achievements
type AchievementRow = {
  title: string;
  zone: string;
  heading: string;
  items: unknown;
  extra_heading: string;
  extra_items: unknown;
};

const strList = (v: unknown) => (Array.isArray(v) ? v.map(String).filter((s) => s.trim()) : []);

export function getAchievements(): Promise<AchievementCard[]> {
  return safe(
    "achievements",
    async () =>
      must<AchievementRow[]>(
        await db
          .from("achievement_cards")
          .select("title,zone,heading,items,extra_heading,extra_items")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ).map((r) => ({
        title: r.title,
        zone: r.zone,
        heading: r.heading,
        items: normalizeItems(r.items),
        extraHeading: r.extra_heading,
        extraItems: normalizeItems(r.extra_items),
      })),
    () => ACHIEVEMENTS,
  );
}
