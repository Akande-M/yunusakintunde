import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Newspaper, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { hostOf, youtubeIdOf, type PressLink } from "@/lib/press";
import { SectionHead } from "./ui";

const PER_PAGE = 16; // 4 × 4

const niceDate = (d: string) => {
  // "2023-07" (month only, when the exact day isn't known) → "July 2023".
  if (/^\d{4}-\d{2}$/.test(d)) {
    try {
      return format(new Date(`${d}-01T12:00:00`), "MMMM yyyy");
    } catch {
      return "";
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}/.test(d)) return "";
  try {
    return format(new Date(`${d.slice(0, 10)}T12:00:00`), "d MMM yyyy");
  } catch {
    return "";
  }
};

/** Real photos of the Senator, used on stories whose website gave no preview picture. */
export const SENATOR_PHOTOS = [
  "/site-images/political/01-press-interview.jpg",
  "/site-images/campaign/13-apc-campaign.jpg",
  "/site-images/yunus_biography1.jpg",
  "/site-images/road-flagoff-speech.jpg",
  "/site-images/political/02-portrait-blue.jpg",
  "/site-images/campaign/16-apc-campaign.jpg",
  "/site-images/yunus_biography3.jpg",
];

/** A stable photo choice per story, so the same card always shows the same picture. */
function photoFor(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  return SENATOR_PHOTOS[h % SENATOR_PHOTOS.length]!;
}

/** Picture for a card: the article's own preview image, the video thumbnail, or a photo of the Senator. */
function Thumb({ item, banner = false }: { item: PressLink; banner?: boolean }) {
  const [broken, setBroken] = useState(false);
  const yt = youtubeIdOf(item.url);
  const own = item.image || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : "");
  const useOwn = !!own && !broken;
  return (
    <div
      className={`relative overflow-hidden bg-paper-2 ${banner ? "aspect-[16/7]" : "aspect-[16/10]"}`}
    >
      <img
        src={useOwn ? own : photoFor(item.url)}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${useOwn ? "" : "object-[center_22%]"}`}
      />
      {yt && useOwn && (
        <PlayCircle
          aria-hidden
          className="absolute top-1/2 left-1/2 size-12 -translate-1/2 text-white drop-shadow-lg"
        />
      )}
      {!useOwn && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-primary-deep/90 px-2.5 py-1 text-[11px] font-bold text-on-dark">
          <Newspaper aria-hidden className="size-3.5 text-accent" />
          {item.source}
        </span>
      )}
    </div>
  );
}

/** Newest first; stories without a date keep their order at the end. */
export function sortPress(items: PressLink[]): PressLink[] {
  return items
    .map((x, i) => ({ x, i }))
    .sort((a, b) => (b.x.date || "").localeCompare(a.x.date || "") || a.i - b.i)
    .map((o) => o.x);
}

/** One story card. */
export function PressCard({ it, onOpen }: { it: PressLink; onOpen: (it: PressLink) => void }) {
  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      <Thumb item={it} />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-[11.5px] font-extrabold tracking-[0.06em] uppercase">
          <span className="truncate text-accent-deep">
            <span className="font-semibold tracking-normal text-muted-foreground normal-case">
              From{" "}
            </span>
            {it.source}
          </span>
          {niceDate(it.date) && (
            <span className="shrink-0 font-semibold tracking-normal text-muted-foreground normal-case">
              {niceDate(it.date)}
            </span>
          )}
        </div>
        <h3 className="line-clamp-3 font-sans text-[15px] leading-snug font-bold text-foreground">
          {it.title}
        </h3>
        {it.summary && (
          <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">{it.summary}</p>
        )}
        <button
          type="button"
          onClick={() => onOpen(it)}
          className="mt-auto inline-flex min-h-10 cursor-pointer items-center gap-1.5 self-start pt-4 text-[14px] font-bold text-primary underline-offset-4 hover:underline"
        >
          {youtubeIdOf(it.url) ? "Watch" : "Read"} <ChevronRight className="size-4" />
        </button>
      </div>
    </article>
  );
}

/** The reader that opens over the page when a story is chosen. */
export function PressReader({ open, onClose }: { open: PressLink | null; onClose: () => void }) {
  const yt = open ? youtubeIdOf(open.url) : null;
  return (
    <Dialog open={!!open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        {open && (
          <article>
            {yt ? (
              <div className="aspect-video w-full bg-black">
                <iframe
                  className="size-full"
                  src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1`}
                  title={open.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <Thumb item={open} banner />
            )}
            <div className="p-6 sm:p-8">
              <div className="mb-2 flex flex-wrap items-center gap-x-3 text-[12px] font-extrabold tracking-[0.06em] text-accent-deep uppercase">
                {open.source}
                {niceDate(open.date) && (
                  <span className="font-semibold tracking-normal text-muted-foreground normal-case">
                    {niceDate(open.date)}
                  </span>
                )}
              </div>
              <DialogTitle className="font-serif text-[24px] leading-tight font-semibold sm:text-[28px]">
                {open.title}
              </DialogTitle>
              <DialogDescription className="mt-4 text-[15.5px] leading-relaxed whitespace-pre-line text-muted-foreground">
                {open.summary || `This story was published by ${open.source}.`}
              </DialogDescription>
              {!yt && (
                <>
                  <a
                    href={open.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-[14.5px] font-bold text-primary-foreground hover:bg-primary-deep"
                  >
                    Read the full story on {open.source} <ExternalLink className="size-4" />
                  </a>
                  <p className="mt-3 text-[12.5px] text-muted-foreground">
                    The full article belongs to {hostOf(open.url) || open.source} and opens on their
                    website in a new tab, so this page stays open.
                  </p>
                </>
              )}
            </div>
          </article>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Article previews from other news websites, 16 per page, each opening in a reader on this site. */
export function PressCoverage({ items }: { items: PressLink[] }) {
  const sorted = useMemo(() => sortPress(items), [items]);
  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<PressLink | null>(null);
  const top = useRef<HTMLElement>(null);
  useEffect(() => setPage((p) => Math.min(p, pages)), [pages]);
  if (!sorted.length) return null;
  const shown = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const go = (p: number) => {
    setPage(p);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section
      ref={top}
      id="in-the-press"
      className="scroll-mt-24 border-t border-border bg-paper-2 py-12 sm:py-14"
    >
      <div className="wrap">
        <SectionHead eyebrow="In the press" title="Senator Akintunde in the news" />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((it) => (
            <li key={it.url} className="flex">
              <PressCard it={it} onOpen={setOpen} />
            </li>
          ))}
        </ul>

        {pages > 1 && (
          <nav aria-label="Press pages" className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-border bg-card text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span
              className="min-w-[110px] text-center text-[14px] font-semibold"
              aria-live="polite"
            >
              Page {page} of {pages}
            </span>
            <button
              type="button"
              onClick={() => go(page + 1)}
              disabled={page === pages}
              aria-label="Next page"
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-border bg-card text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-5" />
            </button>
          </nav>
        )}
      </div>

      <PressReader open={open} onClose={() => setOpen(null)} />
    </section>
  );
}
