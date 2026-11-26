import { db } from "@/lib/db";
import { siteUrl } from "@/lib/asset-url";
import { normalizeLga } from "@/lib/lgas";

/*
 * CMS pages (site_pages) and the navigation menu (menu_items).
 * Pages are built from ordered sections. Some section types embed content the CMS
 * already manages elsewhere, so it is edited in one place and shows everywhere.
 */

export type CardItem = { title: string; text: string; image: string };
export type GalleryImage = { url: string; caption: string };
export type Topic = "outreach" | "infrastructure" | "empowerment";

type SectionBody =
  | {
      type: "text";
      heading: string;
      body: string;
      image: string;
      caption: string;
      imageSide: "left" | "right";
      /** Optional second photo, shown overlapping the first. */
      image2?: string;
      caption2?: string;
    }
  | {
      type: "cards";
      heading: string;
      intro: string;
      items: CardItem[];
      /** Optional photo shown beside the heading. */
      image?: string;
      caption?: string;
    }
  | { type: "gallery"; heading: string; images: GalleryImage[] }
  | {
      type: "list";
      heading: string;
      intro: string;
      items: string[];
      /** Numbered (1, 2, 3) or bullet points. */
      style?: "numbered" | "bulleted";
      /** Optional closing text under the list. */
      outro?: string;
      /** Optional photo shown beside the heading. */
      image?: string;
      caption?: string;
    }
  | { type: "projects"; heading: string; intro: string } // Admin → Record & Agenda → Projects
  | { type: "legislative"; heading: string; intro: string } // Admin → Achievements → Senate cards
  | { type: "topic"; heading: string; intro: string; topic: Topic } // Admin → Achievements, filtered
  | { type: "areas"; heading: string; intro: string } // local government content from AREA_PAGES
  | { type: "finder"; heading: string; intro: string } // search AREA_PAGES by local government and category
  | { type: "subpages"; heading: string; intro: string }; // one tab per page linked under this page in the menu

/**
 * Every section can belong to one local government (lga). Sections with an lga show under
 * that local government's tab; sections without one are about the whole district.
 */
export type PageSection = SectionBody & {
  lga?: string;
  /** Sections with a tab name are shown in tabs (one tab per name, in page order). */
  tab?: string;
};

/** Pages whose local-government content the "areas" section gathers into one set of tabs. */
export const AREA_PAGES = [
  { slug: "infrastructure-projects", title: "Infrastructure" },
  { slug: "outreach", title: "Outreach" },
  { slug: "skills-jobs-and-empowerment", title: "Skills, Jobs & Empowerment" },
] as const;

export type SitePage = {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  seoDescription: string;
  sections: PageSection[];
};

export const SECTION_LABELS: Record<PageSection["type"], string> = {
  text: "Text (with optional photo)",
  cards: "Cards with photos",
  gallery: "Photo gallery",
  list: "List (numbered or bullet points)",
  projects: "Projects list (from Record & Agenda → Projects)",
  legislative: "Bills & motions (from Achievements → Legislative Duties)",
  topic: "Local government tabs (adds matching Achievements)",
  areas: "Local government tabs from Outreach, Infrastructure & Skills pages",
  finder: "Project finder (filter by local government and category)",
  subpages: "Tabs of the pages under this page in the menu",
};

export const TOPIC_LABELS: Record<Topic, string> = {
  outreach: "Outreach (medical outreaches, health, UN Women training)",
  infrastructure: "Infrastructure (roads, streetlights, boreholes, classrooms)",
  empowerment: "Skills, jobs & empowerment (training, equipment, grants)",
};

/** Which achievements belong to each topic, by their wording. */
export const TOPIC_RULES: Record<Topic, RegExp> = {
  outreach: /medical outreach|health check|patients|UN Women|violence against women/i,
  infrastructure:
    /streetlight|borehole|road|drainage|classroom|construction|renovation|water scheme|ICT centre/i,
  empowerment:
    /training|empower|grinding|welding|mechanic|sewing|tailoring|GSM|ICT|cash grant|startup|scholarship|tuition|artisan|tractor|farm/i,
};

export function blankSection(type: PageSection["type"]): PageSection {
  switch (type) {
    case "text":
      return { type, heading: "", body: "", image: "", caption: "", imageSide: "right" };
    case "cards":
      return { type, heading: "", intro: "", items: [] };
    case "gallery":
      return { type, heading: "", images: [] };
    case "list":
      return { type, heading: "", intro: "", items: [], style: "numbered" };
    case "topic":
      return { type, heading: "", intro: "", topic: "outreach" };
    case "areas":
      return { type, heading: "Projects by local government", intro: "" };
    case "subpages":
      return { type, heading: "", intro: "" };
    case "finder":
      return { type, heading: "Find a project", intro: "" };
    default:
      return { type, heading: "", intro: "" } as PageSection;
  }
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Tolerant reader: fills missing fields so an older or hand-edited row never breaks a page. */
export function normalizeSections(v: unknown): PageSection[] {
  if (!Array.isArray(v)) return [];
  const out: PageSection[] = [];
  for (const raw of v as Record<string, unknown>[]) {
    const type = raw?.["type"] as PageSection["type"];
    if (!type || !(type in SECTION_LABELS)) continue;
    const base = { ...blankSection(type), ...raw } as PageSection;
    base.lga = normalizeLga(raw["lga"]);
    base.tab = str(raw["tab"]).trim();
    if (base.type === "text") {
      base.image = siteUrl(str(base.image));
      base.image2 = siteUrl(str(base.image2));
      base.caption2 = str(base.caption2);
    }
    if (base.type === "list" || base.type === "cards") {
      base.image = siteUrl(str(base.image));
      base.caption = str(base.caption);
    }
    if (base.type === "cards")
      base.items = (Array.isArray(base.items) ? base.items : []).map((i) => ({
        title: str(i?.title),
        text: str(i?.text),
        image: siteUrl(str(i?.image)),
      }));
    if (base.type === "gallery")
      base.images = (Array.isArray(base.images) ? base.images : [])
        .map((i) => ({ url: siteUrl(str(i?.url)), caption: str(i?.caption) }))
        .filter((i) => i.url);
    if (base.type === "list")
      base.items = (Array.isArray(base.items) ? base.items : []).map(str).filter((t) => t.trim());
    out.push(base);
  }
  return out;
}

type PageRow = {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  hero_image: string | null;
  hero_alt: string;
  seo_description: string;
  sections: unknown;
};

export function toSitePage(r: PageRow): SitePage {
  return {
    slug: r.slug,
    title: r.title,
    eyebrow: r.eyebrow,
    intro: r.intro,
    heroImage: siteUrl(r.hero_image ?? "") || "",
    heroAlt: r.hero_alt,
    seoDescription: r.seo_description,
    sections: normalizeSections(r.sections),
  };
}

export async function getPage(slug: string): Promise<SitePage | null> {
  try {
    const { data, error } = await db
      .from("site_pages")
      .select("slug,title,eyebrow,intro,hero_image,hero_alt,seo_description,sections")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return data ? toSitePage(data as PageRow) : null;
  } catch (err) {
    console.warn("[cms] page", slug, err);
    return null;
  }
}

/** A page linked under another page in the menu, for the "subpages" tabs. */
export type SubPage = {
  slug: string;
  label: string;
  title: string;
  intro: string;
  sections: PageSection[];
};

/** The published pages linked under `slug` in the top menu, in menu order. */
export async function getSubpages(slug: string): Promise<SubPage[]> {
  try {
    const menu = await db.from("menu_items").select("id,label,page_slug,parent_id,sort_order");
    if (menu.error) throw menu.error;
    const rows = (menu.data ?? []) as {
      id: string;
      label: string;
      page_slug: string | null;
      parent_id: string | null;
      sort_order: number;
    }[];
    const me = rows.find((r) => r.page_slug === slug);
    if (!me) return [];
    const kids = rows
      .filter((r) => r.parent_id === me.id && r.page_slug)
      .sort((a, b) => a.sort_order - b.sort_order);
    if (!kids.length) return [];
    const { data, error } = await db
      .from("site_pages")
      .select("slug,title,intro,sections")
      .in(
        "slug",
        kids.map((k) => k.page_slug!),
      )
      .eq("status", "published");
    if (error) throw error;
    const pages = (data ?? []) as {
      slug: string;
      title: string;
      intro: string;
      sections: unknown;
    }[];
    return kids.flatMap((k) => {
      const p = pages.find((x) => x.slug === k.page_slug);
      return p
        ? [
            {
              slug: p.slug,
              label: k.label,
              title: p.title,
              intro: p.intro ?? "",
              sections: normalizeSections(p.sections),
            },
          ]
        : [];
    });
  } catch (err) {
    console.warn("[cms] subpages", err);
    return [];
  }
}

/** A local-government section from another page, for the "areas" tabs. */
export type AreaSection = { page: string; slug: string; section: PageSection };

/** Gathers the local-government sections of the Outreach, Infrastructure and Skills pages. */
export async function getAreaSections(): Promise<AreaSection[]> {
  try {
    const { data, error } = await db
      .from("site_pages")
      .select("slug,title,sections")
      .in(
        "slug",
        AREA_PAGES.map((p) => p.slug),
      )
      .eq("status", "published");
    if (error) throw error;
    const rows = (data ?? []) as { slug: string; title: string; sections: unknown }[];
    const out: AreaSection[] = [];
    for (const p of AREA_PAGES) {
      const row = rows.find((r) => r.slug === p.slug);
      if (!row) continue;
      for (const s of normalizeSections(row.sections))
        if (s.lga) out.push({ page: row.title || p.title, slug: p.slug, section: s });
    }
    return out;
  } catch (err) {
    console.warn("[cms] area sections", err);
    return [];
  }
}

// ---------------------------------------------------------------- menu
export type MenuNode = {
  label: string;
  href: string | null;
  icon?: string | null; // a key of NAV_ICONS; empty = picked from the wording
  children: MenuNode[];
};

/** Used only if the database can't be reached: the built-in pages that always exist. */
export const FALLBACK_MENU: MenuNode[] = [
  { label: "Home", href: "/", children: [] },
  {
    label: "About",
    href: null,
    children: [
      { label: "Biography", href: "/biography", children: [] },
      { label: "Achievements", href: "/achievements", children: [] },
    ],
  },
  {
    label: "News & Media",
    href: null,
    children: [
      { label: "News & Updates", href: "/news", children: [] },
      { label: "Media Gallery", href: "/media", children: [] },
    ],
  },
];

type MenuRow = {
  id: string;
  parent_id: string | null;
  label: string;
  href: string | null;
  page_slug: string | null;
  sort_order: number;
  icon?: string | null;
};

/**
 * Builds the visible menu tree. Every visible link shows, including links to pages that
 * aren't published yet (those open a "coming soon" page). A group with nothing inside is dropped.
 */
export function buildMenu(rows: MenuRow[]): MenuNode[] {
  const byParent = new Map<string | null, MenuRow[]>();
  for (const r of rows) {
    const list = byParent.get(r.parent_id) ?? [];
    list.push(r);
    byParent.set(r.parent_id, list);
  }
  const build = (parent: string | null, depth: number): MenuNode[] =>
    (byParent.get(parent) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((r): MenuNode | null => {
        const href = r.page_slug ? `/${r.page_slug}` : r.href?.trim() || null;
        const children = depth < 3 ? build(r.id, depth + 1) : [];
        if (!href && children.length === 0) return null;
        return { label: r.label, href, icon: r.icon ?? null, children };
      })
      .filter((n): n is MenuNode => n !== null);
  return build(null, 1);
}

export async function getMenu(): Promise<MenuNode[]> {
  try {
    const cols = "id,parent_id,label,href,page_slug,sort_order";
    const withIcon = await db.from("menu_items").select(`${cols},icon`).eq("visible", true);
    // Before the icon column exists (migration 20261123130000), load without it.
    const items = withIcon.error
      ? await db.from("menu_items").select(cols).eq("visible", true)
      : withIcon;
    if (items.error) throw items.error;
    const menu = buildMenu((items.data ?? []) as MenuRow[]);
    return menu.length ? menu : FALLBACK_MENU;
  } catch (err) {
    console.warn("[cms] menu: using built-in fallback", err);
    return FALLBACK_MENU;
  }
}

/**
 * For a menu link whose page isn't published yet: the menu text, so the link opens a
 * "coming soon" page instead of a 404. Draft content is never shown to visitors.
 */
export async function getComingSoon(slug: string): Promise<string | null> {
  try {
    const { data, error } = await db
      .from("menu_items")
      .select("label")
      .eq("page_slug", slug)
      .eq("visible", true)
      .limit(1);
    if (error) throw error;
    return ((data ?? []) as { label: string }[])[0]?.label ?? null;
  } catch {
    return null;
  }
}

/** Web addresses already used by built-in pages (kept in step with the database check). */
export const RESERVED_SLUGS = [
  "admin",
  "news",
  "media",
  "biography",
  "achievements",
  "support",
  "get-involved",
  "privacy",
  "sitemap",
  "record-agenda",
  "p",
  "api",
  "assets",
  "site-images",
  "hero",
  "brand",
];

/** Built-in pages that can be linked from the menu. */
export const BUILT_IN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/biography", label: "Biography" },
  { href: "/achievements", label: "Achievements" },
  { href: "/news", label: "News & Updates" },
  { href: "/media", label: "Media Gallery" },
  { href: "/support", label: "Support card" },
  { href: "/get-involved", label: "Get in touch" },
  { href: "/privacy", label: "Privacy policy" },
];
