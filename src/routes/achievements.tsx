import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LGAS, matchLga, ZONES } from "@/lib/lgas";
import { getAchievements, getRecord } from "@/lib/cms";
import { ShapedImage } from "@/components/site/ShapedImage";
import { PromiseTracker } from "@/components/site/PromiseTracker";
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
          "Every project Senator Yunus Abiodun Akintunde, PhD has delivered across Oyo Central, local government by local government, plus his sponsored bills and motions, every 2023 promise tracked and the 2027 agenda.",
      },
      {
        property: "og:title",
        content: "Major Achievements | Senator Yunus Abiodun Akintunde, PhD",
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
    return [...cards].sort((a, b) => rank(a) - rank(b));
  }, [cards]);
  // "All", "zone:Ibadan", "lga:Oyo East" or "senate".
  const [filter, setFilter] = useState("All");
  const shown = ordered.filter((c) => {
    if (filter === "All") return true;
    if (filter === "senate") return isSenate(c);
    if (filter.startsWith("zone:")) return !isSenate(c) && c.zone === filter.slice(5);
    return !isSenate(c) && matchLga(c.title) === filter.slice(4);
  });

  const lgaCards = cards.filter((c) => !isSenate(c));
  const stats = [
    { n: lgaCards.length, l: "Local governments" },
    { n: lgaCards.reduce((a, c) => a + c.items.length, 0), l: "Projects & programmes" },
    { n: sumOf(lgaCards, /(\d[\d,]*)\s+solar[- ]powered streetlights/i), l: "Solar streetlights" },
    { n: sumOf(lgaCards, /(\d[\d,]*)\s+patients/i), l: "Patients treated at outreaches" },
  ].filter((s) => s.n > 0);

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
                  {s.n.toLocaleString("en-NG")}
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
            {ordered.some(isSenate) && (
              <Chip active={filter === "senate"} onClick={() => setFilter("senate")}>
                Legislative duties
              </Chip>
            )}
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

                <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {c.items.map((it, i) => {
                    const Ico = iconFor(it.text);
                    return (
                      <Reveal key={i} as="li" delay={Math.min(i, 7) * 50} className="flex">
                        <article className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card">
                          <div className="relative bg-primary-tint">
                            {it.image ? (
                              <ShapedImage url={it.image} alt={it.text} maxPortraitHeight={false} />
                            ) : (
                              <div className="grid aspect-[4/3] w-full place-items-center">
                                <Ico className="size-12 text-primary/55" aria-hidden />
                              </div>
                            )}
                            <span className="absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-primary-deep text-[13px] font-bold text-primary-foreground">
                              {i + 1}
                            </span>
                          </div>
                          <p className="p-4 text-[14px] leading-snug">
                            <Emphasised text={it.text} />
                          </p>
                        </article>
                      </Reveal>
                    );
                  })}
                </ol>

                {c.extraItems.length > 0 && (
                  <div className="mt-5 rounded-lg border border-border bg-paper-2 p-5">
                    <h3 className="mb-2 text-[12px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
                      {c.extraHeading || "Also"}
                    </h3>
                    <ul className="grid gap-x-6 gap-y-1.5 text-[14px] sm:grid-cols-2">
                      {c.extraItems.map((x, i) => (
                        <li key={i} className="flex gap-2">
                          <span aria-hidden className="text-accent">
                            ◆
                          </span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>

      <PromiseTracker kept={record.kept} agenda={record.agenda} />

      <section className="bg-primary-deep py-14 text-on-dark">
        <div className="wrap flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          {page.portrait && <LetsDoMore portrait={page.portrait} tagline={page.tagline} />}
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/support" className={btn.gold}>
              Support Senator Akintunde in 2027
            </Link>
            <Link to="/get-involved" className={btn.ghostDark}>
              Join the campaign
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
