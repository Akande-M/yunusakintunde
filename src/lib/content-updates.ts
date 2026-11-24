import { db } from "@/lib/db";
import { BILLS_AND_MOTIONS_PAGE, SENATE_CARD } from "@/content-updates/2026-11-24-bills-and-motions";

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
      await upsertPage("bills-and-motions", JSON.parse(JSON.stringify(BILLS_AND_MOTIONS_PAGE)) as PageSeed);
      const card = await db
        .from("achievement_cards")
        .update({
          heading: SENATE_CARD.heading,
          items: [...SENATE_CARD.items],
          extra_heading: SENATE_CARD.extra_heading,
          extra_items: [...SENATE_CARD.extra_items],
        })
        .eq("zone", "Senate")
        .select("id");
      if (card.error) throw card.error;
    },
  },
];

type Log = Record<string, { status: "applied" | "skipped"; at: string; by: string }>;

export async function loadUpdateLog(): Promise<Log> {
  const { data } = await db.from("site_settings").select("value").eq("key", "content_updates").maybeSingle();
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
