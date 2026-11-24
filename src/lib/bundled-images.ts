import { db } from "@/lib/db";
import { canLoadImage, uploadMedia } from "@/components/admin/upload";
import { splitShape, withShape } from "@/lib/image-shape";

/*
 * Photos that ship with the code (public/site-images/<folder>/…) only exist on a host once that
 * host has deployed the latest code. Lovable's publish and Vercel's deploy don't always happen at
 * the same moment, so a page could point at a photo the live host doesn't have yet.
 *
 * To make photos show everywhere, straight away, they are copied into the CMS media library
 * (Supabase storage, the same place CMS uploads go) the first time they're used, taken from the
 * GitHub repository. After that they behave exactly like photos uploaded in the CMS.
 */

const RAW = "https://raw.githubusercontent.com/Akande-M/yunusakintunde/main/public";
const LOG_KEY = "private_imported_images";

/** A photo shipped in a sub-folder of public/site-images (built-in top-level images are left alone). */
export const isBundledPath = (v: unknown): v is string =>
  typeof v === "string" && /^\/site-images\/[^/#?]+\/[^#?]+\.(jpe?g|png|webp)(#shape=\w+)?$/i.test(v);

type ImportLog = Record<string, string>;

async function loadLog(): Promise<ImportLog> {
  const { data } = await db.from("site_settings").select("value").eq("key", LOG_KEY).maybeSingle();
  return ((data as { value?: ImportLog } | null)?.value ?? {}) as ImportLog;
}

async function saveLog(log: ImportLog) {
  await db.from("site_settings").upsert({ key: LOG_KEY, value: log }, { onConflict: "key" });
}

async function fetchBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.type.startsWith("image/") || blob.size > 1000 ? blob : null;
  } catch {
    return null;
  }
}

/** Copies one bundled photo into the media library (once) and returns its permanent URL. */
async function importOne(path: string, log: ImportLog): Promise<string> {
  const known = log[path];
  if (known && (await canLoadImage(known))) return known;
  const blob = (await fetchBlob(`${RAW}${path}`)) ?? (await fetchBlob(path));
  if (!blob) throw new Error(`Couldn't find the photo ${path}. Has the latest zip been uploaded to GitHub?`);
  const name = path.split("/").pop() ?? "photo.jpg";
  const url = await uploadMedia(new File([blob], name, { type: blob.type || "image/jpeg" }), "site");
  log[path] = url;
  return url;
}

/** Replaces every bundled photo path inside a value (page, card, settings…) with a media-library URL. */
export async function hostBundledImages<T>(
  value: T,
  onProgress?: (done: number, total: number) => void,
): Promise<T> {
  const paths = new Set<string>();
  const walk = (v: unknown) => {
    if (isBundledPath(v)) paths.add(splitShape(v).src);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  if (!paths.size) return value;

  const log = await loadLog();
  const map = new Map<string, string>();
  let done = 0;
  const list = [...paths];
  // A few at a time, so large galleries don't overwhelm a slow connection.
  for (let i = 0; i < list.length; i += 4) {
    await Promise.all(
      list.slice(i, i + 4).map(async (p) => {
        map.set(p, await importOne(p, log));
        onProgress?.(++done, list.length);
      }),
    );
  }
  await saveLog(log);

  const swap = (v: unknown): unknown => {
    if (isBundledPath(v)) {
      const { src, shape } = splitShape(v);
      return withShape(map.get(src) ?? src, shape);
    }
    if (Array.isArray(v)) return v.map(swap);
    if (v && typeof v === "object")
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]));
    return v;
  };
  return swap(value) as T;
}

/**
 * Finds bundled photos already saved in the CMS (pages, achievement cards, site settings) and
 * moves them into the media library, so they show on every host. Returns how many were fixed.
 */
export async function fixBundledImagesEverywhere(
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const [pages, cards, settings] = await Promise.all([
    db.from("site_pages").select("id,hero_image,sections"),
    db.from("achievement_cards").select("id,items"),
    db.from("site_settings").select("key,value"),
  ]);
  for (const r of [pages, cards, settings]) if (r.error) throw r.error;
  const rows = {
    pages: (pages.data ?? []) as { id: string; hero_image: string | null; sections: unknown }[],
    cards: (cards.data ?? []) as { id: string; items: unknown }[],
    settings: ((settings.data ?? []) as { key: string; value: unknown }[]).filter(
      (s) => !s.key.startsWith("private_") && s.key !== "content_updates",
    ),
  };
  const before = JSON.stringify(rows);
  const fixed = await hostBundledImages(rows, onProgress);
  if (JSON.stringify(fixed) === before) return 0;

  let count = 0;
  for (let i = 0; i < rows.pages.length; i++) {
    const a = rows.pages[i]!;
    const b = fixed.pages[i]!;
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    const r = await db.from("site_pages").update({ hero_image: b.hero_image, sections: b.sections }).eq("id", a.id);
    if (r.error) throw r.error;
    count++;
  }
  for (let i = 0; i < rows.cards.length; i++) {
    const a = rows.cards[i]!;
    const b = fixed.cards[i]!;
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    const r = await db.from("achievement_cards").update({ items: b.items }).eq("id", a.id);
    if (r.error) throw r.error;
    count++;
  }
  for (let i = 0; i < rows.settings.length; i++) {
    const a = rows.settings[i]!;
    const b = fixed.settings[i]!;
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    const r = await db.from("site_settings").update({ value: b.value }).eq("key", a.key);
    if (r.error) throw r.error;
    count++;
  }
  return count;
}

/** How many different bundled photos are still referenced by CMS content. */
export async function countBundledImages(): Promise<number> {
  const [pages, cards, settings] = await Promise.all([
    db.from("site_pages").select("hero_image,sections"),
    db.from("achievement_cards").select("items"),
    db.from("site_settings").select("key,value"),
  ]);
  const paths = new Set<string>();
  const walk = (v: unknown) => {
    if (isBundledPath(v)) paths.add(splitShape(v).src);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(pages.data);
  walk(cards.data);
  walk(((settings.data ?? []) as { key: string }[]).filter((s) => !s.key.startsWith("private_")));
  return paths.size;
}
