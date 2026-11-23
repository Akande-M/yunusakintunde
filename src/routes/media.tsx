import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GALLERY_FILTERS } from "@/lib/site-data";
import { getGallery, youtubeId, type GalleryView } from "@/lib/cms";
import { useSiteSettings } from "@/lib/use-settings";
import { Chip, PageHeader, SmartImage } from "@/components/site/ui";
import { Reveal } from "@/components/site/Reveal";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media: Photos & video from Oyo Central | Akintunde 2027" },
      {
        name: "description",
        content:
          "Photographs from the Senate chamber, delivered constituency projects, town halls and the 2027 campaign trail, plus an archived 2023 set.",
      },
      { property: "og:title", content: "Media | Senator Yunus Abiodun Akintunde, PhD" },
      {
        property: "og:description",
        content: "Senate proceedings, delivered projects and the road to 2027 in pictures.",
      },
    ],
  }),
  loader: () => getGallery(),
  component: Media,
});

function isPlayable(g: GalleryView) {
  return g.kind === "youtube" || g.kind === "video";
}

function Viewer({ item }: { item: GalleryView }) {
  if (item.kind === "youtube") {
    const id = youtubeId(item.url);
    return (
      <div className="relative aspect-video bg-black">
        {id && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={item.caption || item.alt || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        )}
      </div>
    );
  }
  if (item.kind === "video") {
    return (
      <video
        src={item.url}
        poster={item.thumb || undefined}
        controls
        autoPlay
        playsInline
        className="max-h-[80vh] w-full bg-black"
      />
    );
  }
  return <img src={item.url} alt={item.alt} className="max-h-[80vh] w-full object-contain" />;
}

function Media() {
  const heading = useSiteSettings().page_headers.media;
  const gallery = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof GALLERY_FILTERS)[number]>("All");
  const [open, setOpen] = useState<GalleryView | null>(null);
  const items = gallery.filter(
    (g) => filter === "All" || g.category === filter || (filter === "Videos" && isPlayable(g)),
  );

  return (
    <>
      <PageHeader {...heading} />
      <section className="py-12 sm:py-14">
        <div className="wrap">
          <div className="mb-7 flex flex-wrap gap-2.5">
            {GALLERY_FILTERS.map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {f}
              </Chip>
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {items.map((g, i) => {
              const overlay = (
                <>
                  <span className="absolute bottom-2 left-2 rounded-sm bg-primary-deep/85 px-2 py-1 text-[11px] font-bold text-primary-foreground">
                    {g.category}
                  </span>
                  {g.archived && (
                    <span className="absolute top-2 right-2 rounded-sm bg-neutral-tint/95 px-2 py-1 text-[11px] font-bold text-neutral-ink">
                      Archived
                    </span>
                  )}
                  {(isPlayable(g) || g.category === "Videos") && (
                    <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                      <span className="grid size-11 place-items-center rounded-full bg-primary-deep/70 text-primary-foreground transition-transform group-hover:scale-110">
                        ▶
                      </span>
                    </span>
                  )}
                </>
              );
              return (
                <Reveal key={g.id} delay={Math.min(i, 7) * 60} as="li" className="group relative">
                  <button
                    type="button"
                    onClick={() => setOpen(g)}
                    className="block w-full cursor-pointer text-left"
                    aria-label={
                      isPlayable(g) ? `Play: ${g.caption || g.alt}` : `View: ${g.caption || g.alt}`
                    }
                  >
                    {g.kind === "video" && !g.thumb ? (
                      <div className="relative aspect-square overflow-hidden rounded-sm bg-primary-deep">
                        <video
                          src={`${g.url}#t=0.5`}
                          muted
                          playsInline
                          preload="metadata"
                          className="size-full object-cover"
                        />
                        {overlay}
                      </div>
                    ) : (
                      <SmartImage
                        src={g.thumb}
                        alt={g.alt}
                        ratio="aspect-square"
                        className="rounded-sm"
                        imgClassName="group-hover:scale-105"
                        overlay={overlay}
                      />
                    )}
                  </button>
                  <p className="mt-2 text-[13px] text-muted-foreground">{g.caption}</p>
                </Reveal>
              );
            })}
          </ul>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing in this category yet.</p>
          )}
        </div>
      </section>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">{open?.caption || open?.alt || "Media"}</DialogTitle>
          {open && <Viewer item={open} />}
          {open?.caption && (
            <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
              {open.caption}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
