import { Link } from "@tanstack/react-router";
import type { AchievementCard } from "@/lib/achievements-data";
import type { Project } from "@/lib/site-data";
import { toParagraphs } from "@/lib/cms";
import { TOPIC_RULES, type PageSection, type SitePage } from "@/lib/pages";
import { Emphasised, iconFor } from "./Achievements";
import { ProjectsList } from "./ProjectsList";
import { Reveal } from "./Reveal";
import { btn, Eyebrow, SectionHead } from "./ui";

/** Content that some section types pull in from other parts of the CMS. */
export type PageData = { projects: Project[]; cards: AchievementCard[] };

export const needsProjects = (p: SitePage) => p.sections.some((s) => s.type === "projects");
export const needsAchievements = (p: SitePage) =>
  p.sections.some((s) => s.type === "legislative" || s.type === "topic");

const isSenate = (c: AchievementCard) => c.zone.toLowerCase() === "senate";

function Paragraphs({ body }: { body: string }) {
  return (
    <div className="space-y-4 text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
      {toParagraphs(body).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

function Photo({
  src,
  alt,
  className = "aspect-[4/3]",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-primary-tint ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
    </div>
  );
}

function AchievementTile({ text, image, n }: { text: string; image: string; n?: number }) {
  const Ico = iconFor(text);
  return (
    <article className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-[4/3] bg-primary-tint">
        {image ? (
          <img src={image} alt={text} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center">
            <Ico className="size-12 text-primary/55" aria-hidden />
          </div>
        )}
        {n !== undefined && (
          <span className="absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-primary-deep text-[13px] font-bold text-primary-foreground">
            {n}
          </span>
        )}
      </div>
      <p className="p-4 text-[14px] leading-snug">
        <Emphasised text={text} />
      </p>
    </article>
  );
}

function Section({ s, data, index }: { s: PageSection; data: PageData; index: number }) {
  const tone = index % 2 === 1 ? "bg-paper-2 border-y border-border" : "";
  switch (s.type) {
    case "text": {
      const hasImg = Boolean(s.image);
      return (
        <section className={`py-12 sm:py-14 ${tone}`}>
          <Reveal
            className={`wrap grid items-center gap-8 ${hasImg ? "lg:grid-cols-2 lg:gap-12" : "max-w-[75ch]"}`}
          >
            <div className={hasImg && s.imageSide === "left" ? "lg:order-2" : ""}>
              {s.heading && (
                <h2 className="mb-4 font-serif text-[26px] font-semibold sm:text-[30px]">
                  {s.heading}
                </h2>
              )}
              <Paragraphs body={s.body} />
            </div>
            {hasImg && (
              <figure>
                <Photo src={s.image} alt={s.caption || s.heading} />
                {s.caption && (
                  <figcaption className="mt-2 text-[13px] text-muted-foreground">
                    {s.caption}
                  </figcaption>
                )}
              </figure>
            )}
          </Reveal>
        </section>
      );
    }
    case "cards":
      if (!s.items.length) return null;
      return (
        <section className={`py-12 sm:py-14 ${tone}`}>
          <div className="wrap">
            {s.heading && <SectionHead title={s.heading} />}
            {s.intro && <p className="-mt-3 mb-8 max-w-[70ch] text-muted-foreground">{s.intro}</p>}
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((c, i) => (
                <Reveal key={i} as="li" delay={Math.min(i, 6) * 50} className="flex">
                  <article className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card">
                    {c.image && (
                      <img
                        src={c.image}
                        alt={c.title}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    )}
                    <div className="p-5">
                      <h3 className="font-sans text-[16px] font-bold text-primary">{c.title}</h3>
                      {c.text && (
                        <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                          {c.text}
                        </p>
                      )}
                    </div>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      );
    case "gallery":
      if (!s.images.length) return null;
      return (
        <section className={`py-12 sm:py-14 ${tone}`}>
          <div className="wrap">
            {s.heading && <SectionHead title={s.heading} />}
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {s.images.map((g, i) => (
                <li key={i}>
                  <figure>
                    <Photo src={g.url} alt={g.caption || s.heading || "Photo"} />
                    {g.caption && (
                      <figcaption className="mt-1.5 text-[13px] text-muted-foreground">
                        {g.caption}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "projects":
      return (
        <section className={`py-12 sm:py-14 ${tone}`}>
          <div className="wrap">
            <SectionHead title={s.heading || "Community projects"} />
            {s.intro && <p className="-mt-3 mb-8 max-w-[70ch] text-muted-foreground">{s.intro}</p>}
            <ProjectsList projects={data.projects} />
          </div>
        </section>
      );
    case "legislative": {
      const senate = data.cards.filter(isSenate);
      if (!senate.length) return null;
      return (
        <section className={`py-12 sm:py-14 ${tone}`}>
          <div className="wrap space-y-12">
            {(s.heading || s.intro) && (
              <div>
                {s.heading && <SectionHead title={s.heading} />}
                {s.intro && <p className="-mt-3 max-w-[70ch] text-muted-foreground">{s.intro}</p>}
              </div>
            )}
            {senate.map((c) => (
              <div key={c.title}>
                <h3 className="mb-5 border-b-2 border-accent pb-3 font-serif text-[24px] font-semibold">
                  {c.heading || c.title}
                </h3>
                <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {c.items.map((it, i) => (
                    <Reveal key={i} as="li" delay={Math.min(i, 7) * 50} className="flex">
                      <AchievementTile text={it.text} image={it.image} n={i + 1} />
                    </Reveal>
                  ))}
                </ol>
                {c.extraItems.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-4 border-b-2 border-accent pb-3 font-serif text-[24px] font-semibold">
                      {c.extraHeading || "Motions"}
                    </h3>
                    <ol className="space-y-3">
                      {c.extraItems.map((x, i) => (
                        <li
                          key={i}
                          className="flex gap-4 rounded-lg border border-border bg-card p-4 text-[15px]"
                        >
                          <span className="font-serif text-[18px] font-semibold text-accent">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{x}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "topic": {
      const rule = TOPIC_RULES[s.topic];
      const groups = data.cards
        .filter((c) => !isSenate(c))
        .map((c) => ({ card: c, items: c.items.filter((it) => rule.test(it.text)) }))
        .filter((g) => g.items.length);
      if (!groups.length) return null;
      return (
        <section className={`py-12 sm:py-14 ${tone}`}>
          <div className="wrap">
            {s.heading && <SectionHead title={s.heading} />}
            {s.intro && <p className="-mt-3 mb-8 max-w-[70ch] text-muted-foreground">{s.intro}</p>}
            <div className="space-y-10">
              {groups.map((g) => (
                <div key={g.card.title}>
                  <h3 className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                    <span className="font-serif text-[21px] font-semibold">{g.card.title}</span>
                    <span className="text-[12px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
                      {g.card.zone} zone
                    </span>
                  </h3>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {g.items.map((it, i) => (
                      <Reveal key={i} as="li" delay={Math.min(i, 7) * 50} className="flex">
                        <AchievementTile text={it.text} image={it.image} />
                      </Reveal>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-10 text-sm text-muted-foreground">
              Drawn from the local government achievements.{" "}
              <Link
                to="/achievements"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                See every achievement
              </Link>
            </p>
          </div>
        </section>
      );
    }
  }
}

export function PageView({ page, data }: { page: SitePage; data: PageData }) {
  return (
    <>
      <section className="border-b border-border bg-paper-2 py-12 sm:py-14">
        <div
          className={`wrap rise-in grid items-center gap-8 ${page.heroImage ? "lg:grid-cols-[1.1fr_.9fr] lg:gap-12" : ""}`}
        >
          <div>
            {page.eyebrow && <Eyebrow>{page.eyebrow}</Eyebrow>}
            <h1 className="font-serif text-[34px] leading-[1.1] font-semibold text-primary-deep sm:text-[44px]">
              {page.title}
            </h1>
            {page.intro && (
              <p className="mt-4 max-w-[62ch] text-[17px] whitespace-pre-line text-muted-foreground">
                {page.intro}
              </p>
            )}
          </div>
          {page.heroImage && (
            <div className="overflow-hidden rounded-lg border border-border bg-primary-tint">
              <img
                src={page.heroImage}
                alt={page.heroAlt || page.title}
                className="aspect-[4/3] w-full object-cover"
                fetchPriority="high"
              />
            </div>
          )}
        </div>
      </section>

      {page.sections.map((s, i) => (
        <Section key={i} s={s} data={data} index={i} />
      ))}

      <section className="bg-primary-deep py-12 text-on-dark">
        <div className="wrap flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
          <p className="font-serif text-[22px] font-semibold text-on-dark">
            Let's do more for Oyo Central.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/support" className={btn.gold}>
              Support Senator Akintunde in 2027
            </Link>
            <Link to="/get-involved" className={btn.ghostDark}>
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
