import { db } from "@/lib/db";
import { SNAPSHOT } from "./2026-11-26-restore-update-22-data";

/*
 * Rolls the content back to how it was after Update 22 (before the master-content update):
 * the eight project, legislative and political pages, the homepage, biography, footer,
 * contact and press settings, the achievement cards, the menu, and the media gallery.
 */
export async function applyRestoreUpdate22(progress: (msg: string) => void) {
  const snap = SNAPSHOT as unknown as {
    pages: Record<string, Record<string, unknown>>;
    settings: Record<string, unknown>;
    cards: Record<string, { items: unknown; extra_items: unknown }>;
    menu: Record<string, Record<string, unknown>>;
    menuDelete: string[];
    gallery: Record<string, { caption: string; alt: string }>;
    galleryDelete: string[];
  };

  progress("Restoring the pages…");
  for (const [slug, fields] of Object.entries(snap.pages)) {
    const r = await db.from("site_pages").update(fields).eq("slug", slug);
    if (r.error) throw r.error;
  }

  progress("Restoring the homepage, biography, footer and press settings…");
  for (const [key, value] of Object.entries(snap.settings)) {
    const r = await db.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    if (r.error) throw r.error;
  }

  progress("Restoring the achievement cards…");
  for (const [id, v] of Object.entries(snap.cards)) {
    const r = await db.from("achievement_cards").update(v).eq("id", id);
    if (r.error) throw r.error;
  }

  progress("Restoring the menu…");
  for (const id of snap.menuDelete) {
    const r = await db.from("menu_items").delete().eq("id", id);
    if (r.error) throw r.error;
  }
  for (const [id, v] of Object.entries(snap.menu)) {
    const r = await db.from("menu_items").update(v).eq("id", id);
    if (r.error) throw r.error;
  }

  progress("Restoring the media gallery…");
  for (const id of snap.galleryDelete) {
    const r = await db.from("gallery_items").delete().eq("id", id);
    if (r.error) throw r.error;
  }
  for (const [id, v] of Object.entries(snap.gallery)) {
    const r = await db.from("gallery_items").update(v).eq("id", id);
    if (r.error) throw r.error;
  }
}
