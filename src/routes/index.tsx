import { createFileRoute, Link } from "@tanstack/react-router";
import { getAchievements, getEndorsements, getNewsList, youtubeId } from "@/lib/cms";
import { AchievementsSection } from "@/components/site/Achievements";
import { useSiteSettings } from "@/lib/use-settings";
import { AutoCarousel } from "@/components/site/AutoCarousel";
import { Play } from "lucide-react";
import { NewsCard, SectionHead, Eyebrow, btn, SmartImage } from "@/components/site/ui";
import { Reveal } from "@/components/site/Reveal";

import { ApcBadge } from "@/components/site/ApcBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Senator Yunus Abiodun Akintunde, PhD | Oyo Central Re-Election 2027" },
      {
        name: "description",
        content:
          "Four years of delivery in Oyo Central: 38 projects, 6 bills, 9 of 9 promises kept. The record and the plan for a second term in 2027.",
      },
      { property: "og:title", content: "Senator Yunus Abiodun Akintunde, PhD | Oyo Central" },
      {
        property: "og:description",
        content:
          "The record of a sitting Senator for Oyo Central, and the case for a second term in 2027.",
      },
    ],
  }),
  loader: async () => {
    const [news, endorsements, achievements] = await Promise.all([
      getNewsList(9),
      getEndorsements(),
      getAchievements(),
    ]);
    return { news, endorsements, achievements };
  },
  component: Home,
});

const VALUE_PROPS = [
  {
    tag: "Delivered",
    title: "A record you can check, ward by ward",
    body: "38 named projects across the Ibadan, Oyo and Ogbomoso zones. Completed work with dates and locations, not pledges.",
  },
  {
    tag: "Active",
    title: "A voice in the Senate for Oyo Central",
    body: "6 bills sponsored or co-sponsored, committee work, and consistent floor participation over four years.",
  },
  {
    tag: "Ahead",
    title: "A clear plan for term two",
    body: "The 2027 Agenda builds directly on what is already working. See exactly what comes next for the district.",
  },
];

function CampaignVideo({ url, caption }: { url: string; caption: string }) {
  const yt = youtubeId(url);
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
        ) : (
          <video src={url} controls preload="metadata" className="absolute inset-0 size-full" />
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
  const { news, endorsements, achievements } = Route.useLoaderData();
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
                  See My Full Record
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

      <AchievementsSection cards={achievements} />

      <section className="py-16 sm:py-19">
        <div className="wrap">
          <SectionHead
            eyebrow="The case for a second term"
            title="Why Oyo Central should re-elect Akintunde"
          />
          <div className="hairline-grid grid sm:grid-cols-3">
            {VALUE_PROPS.map((v, i) => (
              <Reveal
                key={v.title}
                delay={i * 90}
                className="bg-card px-6 py-7 transition-all duration-300 hover:-translate-y-1 hover:bg-primary-tint/40 hover:shadow-[0_14px_30px_rgba(18,52,36,.09)]"
              >
                <span className="text-xs font-bold text-accent-deep">{v.tag}</span>
                <h3 className="mt-2 text-[19px] leading-snug font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </Reveal>
            ))}
          </div>
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
            </AutoCarousel>
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
              Senator Yunus Abiodun Akintunde, PhD, Oyo Central Senatorial District
            </div>
            <ApcBadge variant="dark" className="mt-5" />
          </Reveal>

          <Reveal delay={120}>
            {home.campaignVideoUrl ? (
              <CampaignVideo url={home.campaignVideoUrl} caption={home.campaignVideoCaption} />
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
          <h2 className="text-[24px] font-semibold sm:text-[28px]">
            I can&apos;t continue this good work without you.
          </h2>
          <p className="mx-auto mt-3 mb-7 max-w-[58ch] text-[17px] text-muted-foreground">
            Volunteer your time, join a ward team, or simply stay in the loop as we head into 2027.
          </p>
          <Link to="/get-involved" className={`${btn.gold} px-7 text-[15px]`}>
            Stand With Senator Akintunde
          </Link>
        </div>
      </section>
    </>
  );
}
