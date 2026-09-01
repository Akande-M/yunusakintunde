import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GALLERY, GALLERY_FILTERS } from "@/lib/site-data";
import { Chip, PageHeader, SmartImage } from "@/components/site/ui";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — In office and on the 2027 campaign trail | Akintunde" },
      {
        name: "description",
        content:
          "Photographs from the Senate chamber, delivered constituency projects, town halls and the 2027 campaign trail, plus an archived 2023 set.",
      },
      { property: "og:title", content: "Gallery — Senator Dr. Yunus Akintunde" },
      {
        property: "og:description",
        content: "Senate proceedings, delivered projects and the road to 2027 in pictures.",
      },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const [filter, setFilter] = useState<(typeof GALLERY_FILTERS)[number]>("All");
  const items = GALLERY.filter((g) => filter === "All" || g.category === filter);

  return (
    <>
      <PageHeader
        eyebrow="Media gallery"
        title="In office, on the campaign trail"
        lede="Senate proceedings, constituency visits, delivered projects, and the road to 2027 — plus an archived record of 2023."
      />
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
            {items.map((g) => (
              <li key={g.caption} className="rise-in group relative">
                <SmartImage
                  src={g.image}
                  alt={g.alt}
                  ratio="aspect-square"
                  className="rounded-sm"
                  overlay={
                    <>
                      <span className="absolute bottom-2 left-2 rounded-sm bg-primary-deep/85 px-2 py-1 text-[11px] font-bold text-primary-foreground">
                        {g.category}
                      </span>
                      {g.archived && (
                        <span className="absolute top-2 right-2 rounded-sm bg-neutral-tint/95 px-2 py-1 text-[11px] font-bold text-neutral-ink">
                          Archived
                        </span>
                      )}
                      {g.category === "Videos" && (
                        <span
                          aria-hidden
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <span className="grid size-11 place-items-center rounded-full bg-primary-deep/70 text-primary-foreground transition-transform group-hover:scale-110">
                            ▶
                          </span>
                        </span>
                      )}
                    </>
                  }
                />
                <p className="mt-2 text-[13px] text-muted-foreground">{g.caption}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
