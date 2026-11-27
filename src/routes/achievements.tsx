import { createFileRoute, Link } from "@tanstack/react-router";
import { countProjects, keyFigures } from "@/lib/key-figures";
import { useMemo, useState } from "react";
import { LGAS, lgaSlug, matchLga, ZONES } from "@/lib/lgas";
import { getAchievements, getRecord } from "@/lib/cms";
import { ShapedImage } from "@/components/site/ShapedImage";
import { ManifestoScorecard } from "@/components/site/ManifestoScorecard";
import type { AchievementCard } from "@/lib/achievements-data";
import { useSiteSettings } from "@/lib/use-settings";
import { btn, Chip, PageHeader } from "@/components/site/ui";
import { Reveal } from "@/components/site/Reveal";
import { Emphasised, iconFor, LetsDoMore } from "@/components/site/Achievements";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Major Achievements by Local Government | Akintunde 2027" },
      {
        name: "description",
        content:
          "Every project Senator Dr Yunus Abiodun Akintunde has delivered across Oyo Central, local government by local government, plus his sponsored bills and motions, every 2023 promise tracked and the 2027 agenda.",
      },
      {
        property: "og:title",
        content: "Major Achievements | Senator Dr Yunus Abiodun Akintunde",
      },
    ],
  }),
  loader: async () => {
    const [cards, record] = await Promise.all([getAchievements(), getRecord()]);
    return { cards, record };
  },
  component: AchievementsPage,
});

const isSenate = (c: AchievementCard) => c.zone.toLowerCase() === "senate";
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** File name without the upload prefix, so the same photo uploaded twice counts once. */
const fileKey = (url: string) =>
  (url.split("#")[0]!.split("/").pop() ?? url).replace(/^[0-9a-f]{8}-/, "").toLowerCase();

/**
 * Up to two real photos per card, with a caption naming what they show. Project photos named
 * in the "Also" list come first. A photo used on more than one card is left out everywhere,
 * so no picture is repeated or shown against the wrong place.
 */
function cardPhotos(cards: AchievementCard[]) {
  const uses = new Map<string, number>();
  for (const c of cards) {
    const seen = new Set<string>();
    for (const x of [...c.extraItems, ...c.items]) if (x.image) seen.add(fileKey(x.image));
    for (const k of seen) uses.set(k, (uses.get(k) ?? 0) + 1);
  }
  const out = new Map<string, { url: string; caption: string }[]>();
  for (const c of cards) {
    const picked: { url: string; caption: string }[] = [];
    const keys = new Set<string>();
    for (const x of [...c.extraItems, ...c.items]) {
      if (picked.length >= 2 || !x.image) continue;
      const k = fileKey(x.image);
      if (keys.has(k) || (uses.get(k) ?? 0) > 1) continue;
      keys.add(k);
      picked.push({ url: x.image, caption: x.text.replace(/\.$/, "") });
    }
    out.set(c.title, picked);
  }
  return out;
}

/** Adds up a figure that appears in the wording, e.g. "714 solar-powered streetlights". */
function sumOf(cards: AchievementCard[], re: RegExp) {
  let total = 0;
  for (const c of cards)
    for (const it of c.items) {
      const m = it.text.match(re);
      if (m?.[1]) total += Number(m[1].replace(/,/g, ""));
    }
  return total;
}

function AchievementsPage() {
  const { cards, record } = Route.useLoaderData();
  const { achievements: page } = useSiteSettings();
  // Local governments in zone order (Ibadan, Oyo, Ogbomoso), then the Senate card.
  const ordered = useMemo(() => {
    const rank = (c: AchievementCard) => {
      if (isSenate(c)) return 100;
      const l = matchLga(c.title);
      return l ? LGAS.indexOf(l) : 50;
    };
    return cards.filter((c) => !isSenate(c)).sort((a, b) => rank(a) - rank(b));
  }, [cards]);
  // "All", "zone:Ibadan", "lga:Oyo East" or "senate".
  const [filter, setFilter] = useState("All");
  const shown = ordered.filter((c) => {
    if (filter === "All") return true;
    if (filter === "senate") return isSenate(c);
    if (filter.startsWith("zone:")) return !isSenate(c) && c.zone === filter.slice(5);
    return !isSenate(c) && matchLga(c.title) === filter.slice(4);
  });

  const { home } = useSiteSettings();
  const stats = keyFigures(home.stats, cards);
  const photos = useMemo(() => cardPhotos(cards), [cards]);

  return (
    <>
      <PageHeader eyebrow="Achievements" title={page.pageTitle} lede={page.pageIntro} />

      <section className="border-b border-border bg-card py-8">
        <div className="wrap">
          <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l}>
                <dt className="sr-only">{s.l}</dt>
                <dd className="font-serif text-[34px] leading-none font-semibold text-primary-deep">
                  {s.n}
                </dd>
                <div className="mt-1.5 text-[13px] font-semibold text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="wrap">
          <div className="mb-4 flex flex-wrap gap-2.5">
            <Chip active={filter === "All"} onClick={() => setFilter("All")}>
              All
            </Chip>
          </div>
          <div className="mb-8 grid gap-4 rounded-lg border border-border bg-card p-4 sm:p-5 lg:grid-cols-[1.25fr_1fr_.6fr]">
            {ZONES.map((z) => (
              <div key={z.zone}>
                <button
                  type="button"
                  aria-pressed={filter === `zone:${z.zone}`}
                  onClick={() => setFilter(`zone:${z.zone}`)}
                  className={`mb-2 cursor-pointer text-[11.5px] font-extrabold tracking-[0.08em] uppercase underline-offset-4 hover:underline ${
                    filter === `zone:${z.zone}` ? "text-primary underline" : "text-accent-deep"
                  }`}
                >
                  {z.zone} zone
                </button>
                <div className="flex flex-wrap gap-2">
                  {z.lgas.map((l) => (
                    <Chip
                      key={l}
                      active={filter === `lga:${l}`}
                      onClick={() => setFilter(`lga:${l}`)}
                    >
                      {l}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <nav
            aria-label="Jump to a local government"
            className="mb-10 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px]"
          >
            {shown.map((c) => (
              <a
                key={c.title}
                href={`#${slug(c.title)}`}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {c.title}
              </a>
            ))}
          </nav>

          {shown.length === 0 && (
            <p className="rounded-lg border border-dashed border-border bg-card px-5 py-6 text-muted-foreground">
              Achievements for this local government will be added soon.
            </p>
          )}
          <div className="space-y-14">
            {shown.map((c) => (
              <section
                key={c.title}
                id={slug(c.title)}
                className="scroll-mt-28"
                aria-labelledby={`${slug(c.title)}-h`}
              >
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b-2 border-accent pb-3">
                  <div>
                    <span className="text-[11.5px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
                      {isSenate(c) ? "In the Senate" : `${c.zone} zone`}
                    </span>
                    <h2
                      id={`${slug(c.title)}-h`}
                      className="mt-1 font-serif text-[26px] font-semibold sm:text-[30px]"
                    >
                      {c.title}
                    </h2>
                  </div>
                  <span className="text-[13.5px] font-semibold text-muted-foreground">
                    {c.items.length} {c.heading.replace(/^\s*\d+\s*/, "").toLowerCase()}
                  </span>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div>
                    <ol className="grid gap-x-6 sm:grid-cols-2">
                      {c.items.map((it, i) => {
                        const Ico = iconFor(it.text);
                        return (
                          <li
                            key={i}
                            className="flex items-start gap-3 border-b border-border/70 py-3"
                          >
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
                              {i + 1}
                            </span>
                            <Ico className="mt-0.5 size-5 shrink-0 text-accent-deep" aria-hidden />
                            <span className="text-[14.5px] leading-snug">
                              <Emphasised text={it.text} />
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    {c.extraItems.length > 0 && (
                      <div className="mt-5 rounded-lg border border-border bg-paper-2 p-4">
                        <h3 className="mb-2.5 text-[12px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
                          {c.extraHeading || "Also"}
                        </h3>
                        <ul className="flex flex-wrap gap-2">
                          {c.extraItems.map((x, i) => (
                            <li
                              key={i}
                              className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-semibold"
                            >
                              {x.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!isSenate(c) && matchLga(c.title) && (
                      <Link
                        to="/$slug"
                        params={{ slug: "infrastructure-projects" }}
                        hash={`lga-${lgaSlug(matchLga(c.title)!)}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold text-primary hover:underline"
                      >
                        Full project list for {matchLga(c.title)} →
                      </Link>
                    )}
                    {isSenate(c) && (
                      <Link
                        to="/$slug"
                        params={{ slug: "bills-and-motions" }}
                        className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold text-primary hover:underline"
                      >
                        Bills & motions in full →
                      </Link>
                    )}
                  </div>
                  {photos.get(c.title)!.length > 0 && (
                    <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
                      {photos.get(c.title)!.map((ph) => (
                        <figure
                          key={ph.url}
                          className="overflow-hidden rounded-lg border border-border bg-card"
                        >
                          <ShapedImage url={ph.url} alt={ph.caption} maxPortraitHeight={false} />
                          <figcaption className="px-3.5 py-2.5 text-[13px] leading-snug font-semibold">
                            {ph.caption}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <ManifestoScorecard items={record.kept} projects={countProjects(cards)} />

      <section className="bg-primary-deep py-14 text-on-dark">
        <div className="wrap flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          {page.portrait && <LetsDoMore portrait={page.portrait} tagline={page.tagline} />}
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/get-involved" className={btn.gold}>
              Get in touch
            </Link>
            <Link to="/$slug" params={{ slug: "bills-and-motions" }} className={btn.ghostDark}>
              Legislative record
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
