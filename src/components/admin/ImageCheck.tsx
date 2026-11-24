import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ImageOff, Loader2, ScanSearch } from "lucide-react";
import { db } from "@/lib/db";
import { IMAGE_SLOTS, mergeSettings } from "@/lib/cms-defaults";
import { normalizeItems } from "@/lib/achievements-data";
import { canLoadImage } from "@/components/admin/upload";
import { abtn, Card } from "@/components/admin/kit";
import { siteUrl } from "@/lib/asset-url";
import { normalizeSections } from "@/lib/pages";
import { splitShape } from "@/lib/image-shape";

type Ref = { url: string; where: string; fix: string };
type Result = { checked: number; broken: Ref[] };

/** Collects every image URL the CMS controls, with where it shows and where to fix it. */
async function collect(): Promise<Ref[]> {
  const [settings, gallery, news, projects, cards, pages] = await Promise.all([
    db.from("site_settings").select("key,value"),
    db.from("gallery_items").select("kind,url,thumbnail_url,caption").eq("published", true),
    db.from("news_posts").select("title,hero_image_url,photos"),
    db.from("projects").select("name,image_url").eq("published", true),
    db.from("achievement_cards").select("title,items").eq("published", true),
    db.from("site_pages").select("id,title,hero_image,sections").eq("status", "published"),
  ]);
  const refs: Ref[] = [];
  const s = mergeSettings((settings.data as { key: string; value: unknown }[]) ?? []);
  s.home.heroSlides.forEach((h, i) =>
    refs.push({
      url: h.url,
      where: `Homepage hero carousel, slide ${i + 1}`,
      fix: "/admin/content",
    }),
  );
  IMAGE_SLOTS.forEach((slot) =>
    refs.push({
      url: s.images[slot.key],
      where: `Site image: ${slot.label}`,
      fix: "/admin/content",
    }),
  );
  if (s.achievements.portrait)
    refs.push({
      url: s.achievements.portrait,
      where: "Achievements “Let’s do more” portrait",
      fix: "/admin/achievements",
    });
  for (const g of (gallery.data ?? []) as {
    kind: string;
    url: string;
    thumbnail_url: string | null;
    caption: string;
  }[]) {
    if (g.kind === "image")
      refs.push({
        url: g.url,
        where: `Media gallery: ${g.caption || "photo"}`,
        fix: "/admin/media",
      });
    if (g.thumbnail_url)
      refs.push({
        url: g.thumbnail_url,
        where: `Media gallery cover: ${g.caption || "video"}`,
        fix: "/admin/media",
      });
  }
  for (const n of (news.data ?? []) as {
    title: string;
    hero_image_url: string | null;
    photos: unknown;
  }[]) {
    if (n.hero_image_url)
      refs.push({
        url: n.hero_image_url,
        where: `News: ${n.title} (main photo)`,
        fix: "/admin/news",
      });
    if (Array.isArray(n.photos))
      (n.photos as { url?: string }[]).forEach(
        (p, i) =>
          p?.url &&
          refs.push({ url: p.url, where: `News: ${n.title} (photo ${i + 1})`, fix: "/admin/news" }),
      );
  }
  for (const p of (projects.data ?? []) as { name: string; image_url: string | null }[])
    if (p.image_url)
      refs.push({ url: p.image_url, where: `Project: ${p.name}`, fix: "/admin/record" });
  for (const c of (cards.data ?? []) as { title: string; items: unknown }[])
    normalizeItems(c.items).forEach(
      (it, i) =>
        it.image &&
        refs.push({
          url: it.image,
          where: `${c.title}: achievement ${i + 1}`,
          fix: "/admin/achievements",
        }),
    );
  for (const p of (pages.data ?? []) as {
    id: string;
    title: string;
    hero_image: string | null;
    sections: unknown;
  }[]) {
    const fix = `/admin/pages/${p.id}`;
    if (p.hero_image) refs.push({ url: p.hero_image, where: `${p.title}: main photo`, fix });
    for (const sec of normalizeSections(p.sections)) {
      if (sec.type === "text" && sec.image)
        refs.push({ url: sec.image, where: `${p.title}: ${sec.heading || "text"} photo`, fix });
      if (sec.type === "cards")
        sec.items.forEach((c) => c.image && refs.push({ url: c.image, where: `${p.title}: card “${c.title}”`, fix }));
      if (sec.type === "gallery")
        sec.images.forEach((g, i) =>
          refs.push({ url: g.url, where: `${p.title}: ${sec.heading || "gallery"} photo ${i + 1}`, fix }),
        );
    }
  }
  return refs.filter((r) => r.url).map((r) => ({ ...r, url: splitShape(r.url).src }));
}

export function ImageCheck() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    const refs = await collect();
    const unique = Array.from(new Set(refs.map((r) => r.url)));
    const ok = new Map<string, boolean>();
    for (let i = 0; i < unique.length; i += 6) {
      const batch = unique.slice(i, i + 6);
      const res = await Promise.all(batch.map((u) => canLoadImage(siteUrl(u))));
      batch.forEach((u, j) => ok.set(u, res[j]!));
    }
    setResult({ checked: unique.length, broken: refs.filter((r) => !ok.get(r.url)) });
    setBusy(false);
  }

  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold">Website images</h2>
          <p className="text-[12.5px] text-muted-foreground">
            Checks every photo set in the CMS loads for visitors: carousel, gallery, news, projects,
            achievements.
          </p>
        </div>
        <button className={abtn.outline} disabled={busy} onClick={() => void run()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}{" "}
          Check all images
        </button>
      </div>
      {result &&
        (result.broken.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="size-4" /> All {result.checked} images load correctly.
          </p>
        ) : (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-destructive">
              {result.broken.length} image{result.broken.length === 1 ? "" : "s"} won’t show to
              visitors. Re-upload each one:
            </p>
            <ul className="divide-y divide-border rounded-sm border border-border">
              {result.broken.map((b, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[13px]"
                >
                  <span className="flex items-center gap-2">
                    <ImageOff className="size-4 shrink-0 text-destructive" /> {b.where}
                  </span>
                  <Link to={b.fix} className="font-bold text-primary">
                    Fix →
                  </Link>
                </li>
              ))}
            </ul>
            {result.broken.every((b) => b.url.includes("/storage/v1/object/public/")) && (
              <p className="mt-3 text-[12.5px] text-muted-foreground">
                All the broken images are CMS uploads. That usually means the photo storage isn’t
                public. In Lovable, ask: “Make the storage bucket named media public.”
              </p>
            )}
          </div>
        ))}
    </Card>
  );
}
