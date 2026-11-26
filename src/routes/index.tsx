import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getAchievements, getEndorsements, getNewsList, youtubeId } from "@/lib/cms";
import { AchievementsSection } from "@/components/site/Achievements";
import { useSiteSettings } from "@/lib/use-settings";
import { AutoCarousel } from "@/components/site/AutoCarousel";
import { ArrowRight, Check, Play } from "lucide-react";
import { ZONES, lgaSlug } from "@/lib/lgas";
import { asStatus, StatusBadge } from "@/components/site/ProjectStatus";
import { NewsCard, SectionHead, Eyebrow, btn, SmartImage } from "@/components/site/ui";
import { Reveal } from "@/components/site/Reveal";

import { ApcBadge } from "@/components/site/ApcBadge";
import { getPressLinks, type PressLink } from "@/lib/press";
import { PressCard, PressReader, sortPress } from "@/components/site/PressCoverage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Senator Dr Yunus Abiodun Akintunde | Oyo Central Senatorial District" },
      {
        name: "description",
        content:
          "Senator Dr Yunus Abiodun Akintunde represents Oyo Central Senatorial District in the 10th Senate: legislative work, constituency projects and development across 11 local government areas.",
      },
      { property: "og:title", content: "Senator Dr Yunus Abiodun Akintunde | Oyo Central" },
      {
        property: "og:description",
        content:
          "Representation that reaches the people: the legislative and constituency record of Senator Akintunde across Oyo Central.",
      },
    ],
  }),
  loader: async () => {
    const [news, endorsements, achievements, press] = await Promise.all([
      getNewsList(9),
      getEndorsements(),
      getAchievements(),
      getPressLinks().catch(() => []),
    ]);
    // The four newest stories from "In the press" join the news carousel.
    return { news, endorsements, achievements, press: sortPress(press).slice(0, 4) };
  },
  component: Home,
});

function CampaignVideo({
  url,
  caption,
  poster,
}: {
  url: string;
  caption: string;
  poster?: string | undefined;
}) {
  const yt = youtubeId(url);
  const [failed, setFailed] = useState(false);
  return (
    <figure className="overflow-hidden rounded-lg border border-on-dark-line bg-primary/25">
      <div className="relative aspect-video bg-black">
        {yt ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0`}
            title={caption || "Akintunde 2027 campaign video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 size-full"
          />
        ) : failed ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-on-dark-muted">
            {poster && (
              <img
                src={poster}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-40"
              />
            )}
            <span className="relative">
              The film couldn't load right now.{" "}
              <a
                href={url}
                className="font-semibold text-on-dark underline"
                target="_blank"
                rel="noreferrer"
              >
                Open it directly
              </a>
            </span>
          </div>
        ) : (
          <video
            src={url}
            poster={poster || undefined}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full bg-black object-contain"
          >
            <track kind="captions" />
          </video>
        )}
      </div>
      {caption && (
        <figcaption className="border-t border-on-dark-line px-5 py-3.5 text-[13px] text-on-dark-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function Home() {
  const { news, endorsements, achievements, press } = Route.useLoaderData();
  const [reading, setReading] = useState<PressLink | null>(null);
  const { home, images } = useSiteSettings();
  const headlineStat = home.stats[0];

  return (
    <>
      <section className="bg-gradient-to-b from-paper to-paper-2 pt-12 pb-0">
        <div className="wrap">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div className="rise-in">
              <Eyebrow>{home.heroEyebrow}</Eyebrow>
              <h1 className="text-[30px] leading-[1.08] font-semibold sm:text-[40px] lg:text-[48px]">
                {home.heroTitle}
              </h1>
              <p className="mt-4 max-w-[62ch] text-[17px] text-muted-foreground sm:text-lg">
                {home.heroBody}
              </p>
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
                <Link to="/support" className={btn.gold}>
                  Support Senator Akintunde in 2027
                </Link>
                <Link to="/achievements" className={btn.outline}>
                  See the full record
                </Link>
              </div>
              <ApcBadge size="lg" className="mt-6" />
            </div>

            <div className="relative rise-in sm:mb-8">
              <div className="relative overflow-hidden rounded-lg">
                <AutoCarousel
                  label="Photos of Senator Akintunde"
                  dotsClassName="absolute right-0 bottom-4 left-0 mt-0"
                >
                  {home.heroSlides.map((slide, i) => (
                    <SmartImage
                      key={slide.url + i}
                      src={slide.url}
                      alt={slide.alt}
                      ratio="aspect-[4/5]"
                      priority={i === 0}
                      imgStyle={{ objectPosition: slide.focus || "center 20%" }}
                    />
                  ))}
                </AutoCarousel>
              </div>
              <span className="absolute top-3 right-3 rounded-sm bg-accent px-3 py-1.5 text-xs font-extrabold text-accent-foreground shadow-lg sm:top-5 sm:-right-3 sm:rotate-3 sm:px-4 sm:py-2 sm:text-[13px]">
                RE-ELECT 2027
              </span>
              {headlineStat && (
                <div className="mt-4 max-w-[240px] border border-border bg-card px-5 py-4 sm:absolute sm:-bottom-8 sm:-left-5 sm:mt-0 sm:shadow-[0_12px_30px_rgba(18,52,36,.12)]">
                  <div className="font-serif text-[26px] font-bold text-primary">
                    {headlineStat.n}
                  </div>
                  <div className="text-[12.5px] text-muted-foreground">{headlineStat.l}</div>
                </div>
              )}
            </div>
          </div>

          <dl className="mt-14 grid grid-cols-2 border-t border-border sm:grid-cols-4">
            {home.stats.map((s, i) => (
              <Reveal
                key={s.l}
                delay={i * 80}
                className="border-b border-border px-3 py-6 text-center sm:border-r sm:last:border-r-0"
              >
                <dt className="sr-only">{s.l}</dt>
                <dd>
                  <div className="font-serif text-[30px] font-semibold text-primary-deep sm:text-[34px]">
                    {s.n}
                  </div>
                  <div className="mt-1 text-[12.5px] font-semibold text-muted-foreground">
                    {s.l}
                  </div>
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-16 sm:py-19">
        <div className="wrap grid gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <Reveal>
            <Eyebrow>About Senator Akintunde</Eyebrow>
            <h2 className="font-serif text-[28px] leading-tight font-semibold text-primary-deep sm:text-[34px]">
              {home.tagline}
            </h2>
            {home.intro
              .split(/\n\s*\n/)
              .filter(Boolean)
              .map((p, i) => (
                <p key={i} className="mt-4 text-[16.5px] leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            <Link to="/biography" className={`${btn.outline} mt-7`}>
              Read the biography
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <div className="rounded-lg border border-border bg-card p-6 sm:p-7">
              <h3 className="font-sans text-[13px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
                {home.focusHeading}
              </h3>
              <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {home.focusAreas.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px] font-semibold">
                    <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-primary-deep py-15 text-on-dark">
        <div className="wrap grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <Reveal>
            <blockquote className="max-w-[46ch] font-serif text-[21px] leading-[1.4] italic sm:text-[26px]">
              “{home.quote}”
            </blockquote>
            <div className="mt-5 text-sm font-semibold text-on-dark-muted">
              Senator Dr Yunus Abiodun Akintunde, Oyo Central Senatorial District
            </div>
            <ApcBadge variant="dark" className="mt-5" />
          </Reveal>

          <Reveal delay={120}>
            {home.campaignVideoUrl ? (
              <CampaignVideo
                url={home.campaignVideoUrl}
                caption={home.campaignVideoCaption}
                poster={home.campaignVideoPoster || images.filmCover}
              />
            ) : (
              <figure className="overflow-hidden rounded-lg border border-on-dark-line">
                <img
                  src={images.filmCover}
                  alt="Senator Akintunde in Oyo Central"
                  loading="lazy"
                  className="aspect-video size-full object-cover object-[center_25%]"
                />
              </figure>
            )}
          </Reveal>
        </div>
      </section>

      <AchievementsSection cards={achievements} />

      <section className="border-y border-border bg-paper-2 py-16 sm:py-19">
        <div className="wrap">
          <SectionHead
            eyebrow="What is happening now"
            title="Legislative activities and project updates"
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {(
              [
                {
                  title: "In the Senate",
                  items: home.legislativeUpdates,
                  to: "/$slug",
                  slug: "bills-and-motions",
                  more: "All bills and motions",
                },
                {
                  title: "Constituency projects",
                  items: home.projectUpdates,
                  to: "/$slug",
                  slug: "constituency-interventions-and-development-projects",
                  more: "Find a project in your local government",
                },
              ] as const
            ).map((col, ci) => (
              <Reveal key={col.title} delay={ci * 100}>
                <div className="flex h-full flex-col rounded-lg border border-border bg-card p-6 sm:p-7">
                  <h3 className="font-serif text-[22px] font-semibold text-primary-deep">
                    {col.title}
                  </h3>
                  <ul className="mt-4 divide-y divide-border">
                    {col.items.map((u, i) => {
                      const st = asStatus(u.status);
                      return (
                        <li key={i} className="py-3.5">
                          {st && <StatusBadge status={st} className="mb-1.5" />}
                          <div className="text-[15.5px] font-bold text-foreground">{u.title}</div>
                          {u.text && (
                            <p className="mt-0.5 text-[14px] text-muted-foreground">{u.text}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    to={col.to}
                    params={{ slug: col.slug }}
                    className="mt-auto inline-flex items-center gap-1.5 self-start pt-4 text-[14px] font-bold text-primary hover:underline"
                  >
                    {col.more} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-19">
        <div className="wrap grid items-start gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <Reveal>
            <Eyebrow>{home.glanceHeading}</Eyebrow>
            <h2 className="font-serif text-[28px] leading-tight font-semibold text-primary-deep sm:text-[34px]">
              {home.featuredTitle}
            </h2>
            <p className="mt-4 text-[16.5px] leading-relaxed text-muted-foreground">
              {home.featuredBody}
            </p>
            <p className="mt-4 text-[15px] font-semibold text-foreground">{home.glanceIntro}</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="grid gap-4 sm:grid-cols-3">
              {ZONES.map((z) => (
                <div key={z.zone} className="rounded-lg border border-border bg-card p-5">
                  <div className="text-[11.5px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
                    {z.zone} zone
                  </div>
                  <ul className="mt-3 space-y-2">
                    {z.lgas.map((l) => (
                      <li key={l}>
                        <Link
                          to="/$slug"
                          params={{ slug: "constituency-interventions-and-development-projects" }}
                          hash={`find-${lgaSlug(l)}`}
                          className="group flex items-center justify-between gap-2 text-[15px] font-semibold text-foreground hover:text-primary"
                        >
                          {l}
                          <ArrowRight
                            aria-hidden
                            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-16 sm:pb-19">
        <div className="wrap">
          <SectionHead
            eyebrow="Latest from the office"
            title="News & updates"
            action={
              <Link to="/news" className={btn.outline}>
                View all news
              </Link>
            }
          />
          <Reveal>
            <AutoCarousel
              label="Latest news and updates"
              gapClassName="-ml-5"
              slideClassName="basis-[88%] pl-5 sm:basis-1/2 lg:basis-1/3"
            >
              {news.map((n) => (
                <div
                  key={n.title}
                  className="flex h-full border border-border bg-card [&>article]:w-full"
                >
                  <NewsCard {...n} />
                </div>
              ))}
              {press.map((p) => (
                <div key={p.url} className="flex h-full">
                  <PressCard it={p} onOpen={setReading} />
                </div>
              ))}
            </AutoCarousel>
          </Reveal>
        </div>
      </section>

      <PressReader open={reading} onClose={() => setReading(null)} />

      {endorsements.length > 0 && (
        <section className="py-16 sm:py-19">
          <div className="wrap">
            <SectionHead eyebrow="Endorsements" title="Standing with Akintunde 2027" />
            <Reveal>
              <AutoCarousel
                label="Endorsements for Senator Akintunde"
                interval={5000}
                gapClassName="-ml-5"
                slideClassName="basis-full pl-5 sm:basis-1/2"
                arrows
              >
                {endorsements.map((e) => (
                  <article
                    key={e.name + e.role}
                    className="flex h-full flex-col border-l-2 border-accent bg-card py-6 pr-6 pl-6 transition-shadow duration-300 hover:shadow-[0_10px_26px_rgba(18,52,36,.1)]"
                  >
                    <blockquote className="font-serif text-[17px] leading-relaxed text-foreground italic">
                      “{e.quote.replace(/^“|”$/g, "")}”
                    </blockquote>
                    <div className="mt-auto pt-4">
                      <span className="block text-sm font-bold text-primary-deep">{e.name}</span>
                      <span className="block text-[13px] text-muted-foreground">{e.role}</span>
                    </div>
                  </article>
                ))}
              </AutoCarousel>
            </Reveal>
          </div>
        </section>
      )}

      <section className="border-t border-border bg-paper-2 py-16">
        <div className="wrap text-center">
          <h2 className="text-[24px] font-semibold sm:text-[28px]">{home.ctaTitle}</h2>
          <p className="mx-auto mt-3 mb-7 max-w-[58ch] text-[17px] text-muted-foreground">
            {home.ctaBody}
          </p>
          <Link to="/get-involved" className={`${btn.gold} px-7 text-[15px]`}>
            Stand With Senator Akintunde
          </Link>
        </div>
      </section>
    </>
  );
}
