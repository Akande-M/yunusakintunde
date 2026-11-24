import { db } from "@/lib/db";
import {
  BILLS_AND_MOTIONS_PAGE,
  SENATE_CARD,
} from "@/content-updates/2026-11-24-bills-and-motions";
import * as LC from "@/content-updates/2026-11-24-legislative-and-constituency";

/*
 * Content updates: new or rewritten content that ships with the code (text, captions, photos
 * in public/site-images) and is written into the CMS when a staff member clicks "Apply" on the
 * dashboard. No SQL, no Lovable chat. Each update runs once; its status is kept in
 * site_settings → content_updates. After applying, everything stays editable in the CMS.
 */

export type ContentUpdate = {
  id: string;
  title: string;
  summary: string;
  /** What gets replaced, shown in the confirmation. */
  replaces: string;
  viewUrl: string;
  apply: () => Promise<void>;
};

type PageSeed = {
  title: string;
  eyebrow: string;
  intro: string;
  hero_image: string;
  hero_alt: string;
  seo_description: string;
  sections: unknown;
};

async function upsertPage(slug: string, p: PageSeed) {
  const row = { ...p, status: "published" as const };
  const existing = await db.from("site_pages").select("id").eq("slug", slug).maybeSingle();
  if (existing.error) throw existing.error;
  const res = existing.data
    ? await db.from("site_pages").update(row).eq("slug", slug)
    : await db.from("site_pages").insert({ ...row, slug });
  if (res.error) throw res.error;
}

const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Puts sections at the top of an existing page, replacing any earlier copy with the same heading. */
async function prependSections(slug: string, add: { heading: string }[]) {
  const { data, error } = await db
    .from("site_pages")
    .select("sections")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return; // page deleted: nothing to add to
  const headings = new Set(add.map((x) => x.heading).filter(Boolean));
  const current = (
    Array.isArray((data as { sections: unknown }).sections)
      ? (data as { sections: { heading?: string }[] }).sections
      : []
  ).filter((x) => !(x.heading && headings.has(x.heading)));
  const res = await db
    .from("site_pages")
    .update({ sections: [...add, ...current] })
    .eq("slug", slug);
  if (res.error) throw res.error;
}

async function updateSenateCard(card: {
  heading: string;
  items: readonly string[];
  extra_heading: string;
  extra_items: readonly string[];
}) {
  const res = await db
    .from("achievement_cards")
    .update({
      heading: card.heading,
      items: [...card.items],
      extra_heading: card.extra_heading,
      extra_items: [...card.extra_items],
    })
    .eq("zone", "Senate");
  if (res.error) throw res.error;
}

export const CONTENT_UPDATES: ContentUpdate[] = [
  {
    id: "2026-11-24-bills-and-motions",
    title: "Bills & Motions: new text, bill list and 20 photos",
    summary:
      "The new introduction, the 6 bills and 2 motions sponsored and supported, the two bills presented at the stakeholders' engagement, and a 20-photo gallery with captions. The Legislative Duties card on Achievements gets the same bill and motion list.",
    replaces:
      "This replaces the current content of the Bills & Motions page and the bill and motion list on the Legislative Duties (Senate) achievement card.",
    viewUrl: "/bills-and-motions",
    apply: async () => {
      await upsertPage(
        "bills-and-motions",
        JSON.parse(JSON.stringify(BILLS_AND_MOTIONS_PAGE)) as PageSeed,
      );
      await updateSenateCard(SENATE_CARD);
    },
  },
  {
    id: "2026-11-24-legislative-and-constituency",
    title:
      "Bills & Motions additions, Committees & Oversight, Constituency Projects & Interventions",
    summary:
      "Bills & Motions: Geomatics bill corrected to 2024 (SB.496), police retirees section, public hearing photos, committee work photos and 5 more Senate photos. Committees & Oversight: chairmanships and 15 committee memberships, published. New Constituency Projects & Interventions page, linked from its menu group. Outreach, Infrastructure Projects and Skills, Jobs & Empowerment each get their new text at the top.",
    replaces:
      "This replaces the content of Bills & Motions and Committees & Oversight, creates the Constituency Projects & Interventions page, and adds a section at the top of Outreach, Infrastructure Projects and Skills, Jobs & Empowerment.",
    viewUrl: "/bills-and-motions",
    apply: async () => {
      await upsertPage("bills-and-motions", plain(LC.BILLS) as PageSeed);
      await updateSenateCard(LC.SENATE);
      await upsertPage("committees-and-oversight", plain(LC.COMMITTEES) as PageSeed);
      const slug = "constituency-interventions-and-development-projects";
      await upsertPage(slug, plain(LC.CONSTITUENCY) as PageSeed);
      // Link the "Constituency Interventions & Development Projects" menu group to the new page.
      const menu = await db
        .from("menu_items")
        .update({ page_slug: slug })
        .ilike("label", "Constituency Interventions%")
        .is("page_slug", null)
        .is("href", null);
      if (menu.error) throw menu.error;
      await prependSections("outreach", [plain(LC.OUTREACH)]);
      await prependSections("infrastructure-projects", [plain(LC.INFRA)]);
      await prependSections(
        "skills-jobs-and-empowerment",
        plain(LC.SKILLS) as { heading: string }[],
      );
    },
  },
];

type Log = Record<string, { status: "applied" | "skipped"; at: string; by: string }>;

export async function loadUpdateLog(): Promise<Log> {
  const { data } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "content_updates")
    .maybeSingle();
  return ((data as { value?: Log } | null)?.value ?? {}) as Log;
}

export async function recordUpdate(id: string, status: "applied" | "skipped", by: string) {
  const log = await loadUpdateLog();
  log[id] = { status, at: new Date().toISOString(), by };
  const { error } = await db
    .from("site_settings")
    .upsert({ key: "content_updates", value: log }, { onConflict: "key" });
  if (error) throw error;
}
