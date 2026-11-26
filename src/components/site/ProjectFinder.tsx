import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ZONES, LGAS, lgaSlug } from "@/lib/lgas";
import type { AreaSection } from "@/lib/pages";
import { parseStatus, StatusBadge, STATUSES, type ProjectStatusName } from "./ProjectStatus";
import { PhotoGallery } from "./PhotoGallery";

/** Intervention categories, in the order the office lists them. Matched on section headings. */
export const CATEGORIES: { name: string; re: RegExp }[] = [
  { name: "Education", re: /classroom|school|education|ict cent/i },
  { name: "Healthcare", re: /health|medical|phc|clinic/i },
  { name: "Roads & Drainage", re: /road|drainage|erosion/i },
  { name: "Water Supply", re: /borehole|water/i },
  { name: "Solar Streetlights & Security", re: /streetlight|solar light|police|security/i },
  { name: "Market Development", re: /market|trader/i },
  { name: "Empowerment & Skills", re: /skill|empower|training|equipment|grant|tailor/i },
  { name: "Agriculture", re: /agric|farm/i },
  { name: "Employment", re: /employ|job|placement/i },
  { name: "Community Development", re: /community development|donation|social|community support/i },
];

export function categoryOf(heading: string): string {
  return CATEGORIES.find((c) => c.re.test(heading))?.name ?? "Other";
}

type Row = {
  key: string;
  lga: string;
  category: string;
  heading: string;
  page: string;
  slug: string;
  items: { status: ProjectStatusName | null; title: string; text: string }[];
  images: { url: string; caption: string }[];
  body: string;
};

function rowsOf(areas: AreaSection[]): Row[] {
  return areas.map((a, i) => {
    const s = a.section;
    const items: Row["items"] = [];
    if (s.type === "list")
      for (const raw of s.items) {
        const { status, rest } = parseStatus(raw);
        const at = rest.indexOf(": ");
        items.push(
          at >= 3
            ? { status, title: rest.slice(0, at), text: rest.slice(at + 2) }
            : { status, title: rest, text: "" },
        );
      }
    if (s.type === "cards")
      for (const c of s.items) items.push({ status: null, title: c.title, text: c.text });
    const heading = "heading" in s ? s.heading : "";
    return {
      key: `${a.slug}-${i}`,
      lga: s.lga ?? "",
      category: categoryOf(`${heading} ${a.page}`),
      heading,
      page: a.page,
      slug: a.slug,
      items,
      images: s.type === "gallery" ? s.images : [],
      body: s.type === "text" ? s.body : "",
    };
  });
}

/**
 * Search of every local-government section on the project pages, by local government and
 * intervention category, with each item's status label.
 */
export function ProjectFinder({
  areas,
  heading,
  intro,
}: {
  areas: AreaSection[];
  heading: string;
  intro: string;
}) {
  const rows = useMemo(() => rowsOf(areas), [areas]);
  const [lga, setLga] = useState("All");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    const m = /^#find-(.+)$/.exec(window.location.hash);
    const hit = m && LGAS.find((l) => lgaSlug(l) === m[1]);
    if (hit) {
      setLga(hit);
      setTimeout(() => document.getElementById("find")?.scrollIntoView({ block: "start" }), 350);
    }
  }, []);

  const cats = CATEGORIES.map((c) => c.name).filter((n) => rows.some((r) => r.category === n));
  const shown = rows
    .filter((r) => lga === "All" || r.lga === lga)
    .filter((r) => cat === "All" || r.category === cat)
    .map((r) =>
      status === "All" ? r : { ...r, items: r.items.filter((it) => it.status === status) },
    )
    .filter((r) => status === "All" || r.items.length > 0)
    .sort(
      (a, b) =>
        CATEGORIES.findIndex((c) => c.name === a.category) -
          CATEGORIES.findIndex((c) => c.name === b.category) ||
        LGAS.indexOf(a.lga as never) - LGAS.indexOf(b.lga as never),
    );

  const chip = (on: boolean) =>
    `inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
      on
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
    }`;

  return (
    <section id="find" className="scroll-mt-24 py-12 sm:py-14">
      <div className="wrap">
        <h2 className="font-serif text-[28px] font-semibold text-primary-deep sm:text-[32px]">
          {heading || "Find a project"}
        </h2>
        {intro && <p className="mt-2 max-w-[70ch] text-muted-foreground">{intro}</p>}

        <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5">
          <div>
            <div className="mb-2 text-[11.5px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
              Local government
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={chip(lga === "All")} onClick={() => setLga("All")}>
                All 11
              </button>
              {ZONES.map((z) =>
                z.lgas.map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={lga === l}
                    className={chip(lga === l)}
                    onClick={() => {
                      setLga(l);
                      history.replaceState(null, "", `#find-${lgaSlug(l)}`);
                    }}
                  >
                    {l}
                  </button>
                )),
              )}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[11.5px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
              Category
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={chip(cat === "All")} onClick={() => setCat("All")}>
                All categories
              </button>
              {cats.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={cat === c}
                  className={chip(cat === c)}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[11.5px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
              Status
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", ...STATUSES].map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  className={chip(status === s)}
                  onClick={() => setStatus(s)}
                >
                  {s === "All" ? "Any status" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-[13.5px] font-semibold text-muted-foreground" aria-live="polite">
          {shown.length} {shown.length === 1 ? "result" : "results"}
          {lga !== "All" ? ` in ${lga}` : ""}
          {cat !== "All" ? ` · ${cat}` : ""}
          {status !== "All" ? ` · ${status}` : ""}
        </p>

        {shown.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border bg-card px-5 py-6 text-muted-foreground">
            Nothing matches these filters yet. Try another local government or category.
          </p>
        ) : (
          <ul className="mt-4 grid gap-5 lg:grid-cols-2">
            {shown.map((r) => (
              <li key={r.key} className="flex flex-col rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-extrabold tracking-[0.06em] uppercase">
                  <span className="rounded-full bg-primary-tint px-2.5 py-0.5 text-primary">
                    {r.category}
                  </span>
                  <span className="text-accent-deep">{r.lga}</span>
                </div>
                {r.heading && r.heading !== r.category && (
                  <h3 className="mt-2 font-sans text-[17px] font-bold text-foreground">
                    {r.heading}
                  </h3>
                )}
                {r.items.length > 0 && (
                  <ul className="mt-3 space-y-2.5">
                    {r.items.map((it, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <span
                          aria-hidden
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                        />
                        <span className="text-[14.5px]">
                          {it.status && <StatusBadge status={it.status} className="mr-2" />}
                          <span className="font-semibold text-foreground">{it.title}</span>
                          {it.text && <span className="text-muted-foreground">: {it.text}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {r.body && (
                  <p className="mt-3 line-clamp-4 text-[14.5px] whitespace-pre-line text-muted-foreground">
                    {r.body}
                  </p>
                )}
                {r.images.length > 0 && (
                  <div className="mt-3">
                    <PhotoGallery images={r.images.slice(0, 6)} label={r.heading || "Photo"} />
                  </div>
                )}
                <Link
                  to="/$slug"
                  params={{ slug: r.slug }}
                  hash={`lga-${lgaSlug(r.lga)}`}
                  className="mt-auto inline-flex items-center gap-1.5 self-start pt-4 text-[13.5px] font-bold text-primary hover:underline"
                >
                  {r.page} <ArrowRight className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
