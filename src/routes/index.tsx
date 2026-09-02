import { createFileRoute, Link } from "@tanstack/react-router";
import { ENDORSEMENTS, NEWS, img } from "@/lib/site-data";
import { Play } from "lucide-react";
import { NewsCard, SectionHead, Eyebrow, btn, SmartImage } from "@/components/site/ui";
import { Reveal } from "@/components/site/Reveal";
import { ApcBadge } from "@/components/site/ApcBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Senator Dr. Yunus Akintunde — Oyo Central | Re-Election 2027" },
      {
        name: "description",
        content:
          "Four years of delivery in Oyo Central: 38 projects, 6 bills, 9 of 9 promises kept. The record and the plan for a second term in 2027.",
      },
      { property: "og:title", content: "Dr. Yunus Akintunde — Senator, Oyo Central" },
      {
        property: "og:description",
        content:
          "The record of a sitting Senator for Oyo Central, and the case for a second term in 2027.",
      },
    ],
  }),
  component: Home,
});

const STATS = [
  { n: "38", l: "Projects delivered" },
  { n: "12", l: "LGAs & wards reached" },
  { n: "6", l: "Bills sponsored" },
  { n: "100%", l: "2023 promises delivered" },
];

const VALUE_PROPS = [
  {
    tag: "Delivered",
    title: "A record you can check, ward by ward",
    body: "38 named projects across the Ibadan, Oyo and Ogbomoso zones — completed work with dates and locations, not pledges.",
  },
  {
    tag: "Active",
    title: "A voice in the Senate for Oyo Central",
    body: "6 bills sponsored or co-sponsored, committee work, and consistent floor participation over four years.",
  },
  {
    tag: "Ahead",
    title: "A clear plan for term two",
    body: "The 2027 Agenda builds directly on what is already working — see exactly what comes next for the district.",
  },
];

function Home() {
  return (
    <>
      <section className="bg-gradient-to-b from-paper to-paper-2 pt-12 pb-0">
        <div className="wrap">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div className="rise-in">
              <Eyebrow>Oyo Central · Seeking re-election, 2027</Eyebrow>
              <h1 className="text-[30px] leading-[1.08] font-semibold sm:text-[40px] lg:text-[48px]">
                Four years of delivery. Now, I&apos;m asking Oyo Central to let us finish the job.
              </h1>
              <p className="mt-4 max-w-[62ch] text-[17px] text-muted-foreground sm:text-lg">
                Dr. Yunus Abiodun Akintunde is the sitting Senator for Oyo Central Senatorial
                District — asking for a second term on the strength of 38 delivered projects, 6
                sponsored bills, and a promise-tracker that shows exactly what has been kept.
              </p>
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
                <Link to="/get-involved" className={btn.gold}>
                  Stand With Dr. Yunus — 2027
                </Link>
                <Link to="/record-agenda" className={btn.outline}>
                  See My Full Record
                </Link>
              </div>
              <ApcBadge size="md" className="mt-6" />
            </div>

            <div className="relative rise-in sm:mb-8">
              <SmartImage
                src={img.portraitWhite}
                alt="Senator Dr. Yunus Akintunde, Oyo Central Senatorial District"
                ratio="aspect-[4/5]"
                priority
                className="rounded-lg"
              />
              <span className="absolute top-3 right-3 rounded-sm bg-accent px-3 py-1.5 text-xs font-extrabold text-accent-foreground shadow-lg sm:top-5 sm:-right-3 sm:rotate-3 sm:px-4 sm:py-2 sm:text-[13px]">
                RE-ELECT 2027
              </span>
              <div className="mt-4 max-w-[240px] border border-border bg-card px-5 py-4 sm:absolute sm:-bottom-8 sm:-left-5 sm:mt-0 sm:shadow-[0_12px_30px_rgba(18,52,36,.12)]">
                <div className="font-serif text-[26px] font-bold text-primary">38</div>
                <div className="text-[12.5px] text-muted-foreground">
                  community projects delivered in four years
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-14 grid grid-cols-2 border-t border-border sm:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal
                key={s.l}
                delay={i * 80}
                className="border-b border-border py-6 pr-4 sm:border-r sm:last:border-r-0"
              >
                <dt className="sr-only">{s.l}</dt>
                <dd>
                  <div className="font-serif text-[28px] font-semibold text-primary-deep sm:text-[30px]">
                    {s.n}
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">{s.l}</div>
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

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
          <div className="hairline-grid grid md:grid-cols-3">
            {NEWS.slice(0, 3).map((n, i) => (
              <Reveal key={n.title} delay={i * 90} className="flex">
                <NewsCard {...n} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-deep py-15 text-on-dark">
        <div className="wrap grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <Reveal>
            <blockquote className="max-w-[46ch] font-serif text-[21px] leading-[1.4] italic sm:text-[26px]">
              “In 2023, Oyo Central gave me a mandate on the strength of a promise. Today, I am
              asking for a second term on the strength of a record — and a plan to finish what we
              started together.”
            </blockquote>
            <div className="mt-5 text-sm font-semibold text-on-dark-muted">
              Dr. Yunus Akintunde — Senator, Oyo Central Senatorial District
            </div>
            <ApcBadge variant="dark" className="mt-5" />
          </Reveal>

          <Reveal delay={120}>
            <figure className="group relative overflow-hidden rounded-lg border border-on-dark-line bg-primary/25">
              <div className="relative aspect-video">
                <img
                  src={img.portraitFist}
                  alt="Placeholder still from the forthcoming Akintunde 2027 campaign film"
                  loading="lazy"
                  className="size-full object-cover object-[center_25%] opacity-40 transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <Play size={26} strokeWidth={2.4} className="ml-0.5" aria-hidden />
                  </span>
                </span>
                <span className="absolute top-3 left-3 rounded-sm bg-primary-deep/85 px-2.5 py-1 text-[11.5px] font-bold text-on-dark">
                  Placeholder — campaign film coming soon
                </span>
              </div>
              <figcaption className="border-t border-on-dark-line px-5 py-3.5 text-[13px] text-on-dark-muted">
                Headline campaign video: “Four years of delivery” — Akintunde 2027.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-19">
        <div className="wrap">
          <SectionHead eyebrow="Endorsements" title="Standing with Akintunde 2027" />
          <div className="grid gap-6 md:grid-cols-3">
            {ENDORSEMENTS.map((e, i) => (
              <Reveal
                key={e.name}
                delay={i * 90}
                as="article"
                className="border-l-2 border-accent bg-card py-6 pr-6 pl-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(18,52,36,.1)]"
              >
                <blockquote className="font-serif text-[17px] leading-relaxed text-foreground italic">
                  “{e.quote}”
                </blockquote>
                <figcaption className="mt-4">
                  <span className="block text-sm font-bold text-primary-deep">{e.name}</span>
                  <span className="block text-[13px] text-muted-foreground">{e.role}</span>
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-paper-2 py-16">
        <div className="wrap text-center">
          <h2 className="text-[24px] font-semibold sm:text-[28px]">
            I can&apos;t finish this work without you.
          </h2>
          <p className="mx-auto mt-3 mb-7 max-w-[58ch] text-[17px] text-muted-foreground">
            Volunteer your time, join a ward team, or simply stay in the loop as we head into 2027.
          </p>
          <Link to="/get-involved" className={`${btn.gold} px-7 text-[15px]`}>
            Stand With Dr. Yunus
          </Link>
        </div>
      </section>
    </>
  );
}
