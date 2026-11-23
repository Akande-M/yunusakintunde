import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "@/lib/pages";

/* Photos at their natural shape (certificates and trophies aren't cropped), each with its
   caption. Click a photo to view it large; arrow keys move between photos, Esc closes. */
export function PhotoGallery({ images, label }: { images: GalleryImage[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  const current = open === null ? null : images[open];

  return (
    <>
      <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {images.map((g, i) => (
          <li key={`${g.url}-${i}`} className="mb-5 break-inside-avoid">
            <figure className="overflow-hidden rounded-lg border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group block w-full cursor-zoom-in overflow-hidden bg-primary-tint"
                aria-label={`View larger: ${g.caption || `photo ${i + 1}`}`}
              >
                <img
                  src={g.url}
                  alt={g.caption || label}
                  loading="lazy"
                  className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
              {g.caption && (
                <figcaption className="px-4 py-3 text-[13.5px] leading-snug text-muted-foreground">
                  {g.caption}
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>

      {current && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || label}
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 text-white"
          onClick={close}
        >
          <div className="flex items-center justify-between px-4 py-3 text-[13px]">
            <span>
              {open + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-white/15"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
            <img
              src={current.url}
              alt={current.caption || label}
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  className="absolute left-2 grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 hover:bg-white/25 sm:left-4"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-2 grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 hover:bg-white/25 sm:right-4"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
          <p className="mx-auto max-w-[70ch] px-6 py-4 text-center text-[14px] text-white/85">
            {current.caption}
          </p>
        </div>
      )}
    </>
  );
}
