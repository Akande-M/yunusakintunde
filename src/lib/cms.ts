import { format } from "date-fns";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/asset-url";
import {
  AGENDA_2027,
  ENDORSEMENTS,
  GALLERY,
  NEWS,
  PROJECTS,
  PROMISES_KEPT,
  type Commitment,
  type GalleryCategory,
  type Project,
} from "@/lib/site-data";
import { STATIC_ARTICLES } from "@/lib/static-articles";
import { ACHIEVEMENTS, normalizeItems, type AchievementCard } from "@/lib/achievements-data";
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
        extraItems: strList(r.extra_items),
      })),
    () => ACHIEVEMENTS,
  );
}
