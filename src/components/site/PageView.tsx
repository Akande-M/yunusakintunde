import { ProjectFinder } from "./ProjectFinder";
import { parseStatus, StatusBadge, StatusLegend } from "./ProjectStatus";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AchievementCard } from "@/lib/achievements-data";
import type { Project } from "@/lib/site-data";
import { toParagraphs } from "@/lib/cms";
import {
  TOPIC_RULES,
  type AreaSection,
  type PageSection,
  type SitePage,
  type SubPage,
} from "@/lib/pages";
import { LGAS, lgaSlug, matchLga, zoneOf, ZONES } from "@/lib/lgas";
import { Emphasised, ItemArt } from "./Achievements";
import { PhotoGallery } from "./PhotoGallery";
import { ShapedImage } from "./ShapedImage";
import { ProjectsList } from "./ProjectsList";
import { Reveal } from "./Reveal";
import { btn, Eyebrow, SectionHead } from "./ui";

/** Content that some section types pull in from other parts of the CMS. */
export type PageData = {
  projects: Project[];
  cards: AchievementCard[];
  areas?: AreaSection[];
  subpages?: SubPage[];
};

export const needsProjects = (p: SitePage) => p.sections.some((s) => s.type === "projects");
export const needsAchievements = (p: SitePage) =>
  p.sections.some((s) => s.type === "legislative" || s.type === "topic");
export const needsAreas = (p: SitePage) =>
  p.sections.some((s) => s.type === "areas" || s.type === "finder");
export const needsSubpages = (p: SitePage) => p.sections.some((s) => s.type === "subpages");
/** Sections shown inside the local-government tabs rather than down the page. */
const inTabs = (s: PageSection) =>
  !s.tab && (Boolean(s.lga) || s.type === "topic" || s.type === "areas");

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

function Photo({ src, alt }: { src: string; alt: string }) {
  return <ShapedImage url={src} alt={alt} className="rounded-lg border border-border" />;
}

function AchievementTile({ text, image, n }: { text: string; image: string; n?: number }) {
  return (
    <article className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative bg-primary-tint">
        {image ? (
          <ShapedImage url={image} alt={text} maxPortraitHeight={false} />
        ) : (
          <ItemArt text={text} />
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

/** "Title: description" shows the title in bold with the description under it. */
function ListText({ text: raw, plain = false }: { text: string; plain?: boolean }) {
  const { status, rest: text } = parseStatus(raw);
  const badge = status ? <StatusBadge status={status} className="mb-1.5" /> : null;
  const at = text.indexOf(": ");
  if (at < 3)
    return (
      <span className={plain ? "" : "pt-1.5"}>
        {badge && <span className="block">{badge}</span>}
        <span
          className={
            plain ? "text-[15px] text-foreground" : "text-[15.5px] font-semibold text-foreground"
          }
        >
          {text}
        </span>
      </span>
    );
  return (
    <span className="pt-1">
      {badge && <span className="block">{badge}</span>}
      <span className="block text-[15.5px] font-bold text-foreground">{text.slice(0, at)}</span>
      <span className="mt-1 block text-[14.5px] text-muted-foreground">{text.slice(at + 2)}</span>
    </span>
  );
}

/** Outer frame of a section: full-width band on the page, or plain block inside a tab. */
function Frame({
  tone,
  compact,
  narrow,
  children,
}: {
  tone: string;
  compact: boolean;
  narrow?: boolean;
  children: ReactNode;
}) {
  if (compact) return <div className="py-6">{children}</div>;
  return (
    <section className={`py-12 sm:py-14 ${tone}`}>
      <div className={`wrap ${narrow ? "max-w-[900px]" : ""}`}>{children}</div>
    </section>
  );
}

function Head({ title, compact }: { title: string; compact: boolean }) {
  if (!title) return null;
  if (compact)
    return <h3 className="mb-4 font-serif text-[22px] font-semibold sm:text-[24px]">{title}</h3>;
  return <SectionHead title={title} />;
}

/** Heading and intro, with the section's own photo beside them when it has one. */
function SectionTop({
  heading,
  intro,
  image,
  caption,
  compact,
}: {
  heading: string;
  intro: string;
  image?: string | undefined;
  caption?: string | undefined;
  compact: boolean;
}) {
  const text = (
    <>
      <Head title={heading} compact={compact} />
      {intro && (
        <p className="-mt-2 mb-6 max-w-[70ch] whitespace-pre-line text-muted-foreground">{intro}</p>
      )}
    </>
  );
  if (!image) return text;
  return (
    <div className="mb-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,.85fr)] lg:gap-10">
      <div>{text}</div>
      <figure>
        <Photo src={image} alt={caption || heading} />
        {caption && (
          <figcaption className="mt-2 text-[13px] text-muted-foreground">{caption}</figcaption>
        )}
      </figure>
    </div>
  );
}

function Section({
  s,
  data,
  index,
  compact = false,
}: {
  s: PageSection;
  data: PageData;
  index: number;
  compact?: boolean;
}) {
  const tone = index % 2 === 1 ? "bg-paper-2 border-y border-border" : "";
  switch (s.type) {
    case "text": {
      const hasImg = Boolean(s.image);
      const two = hasImg && Boolean(s.image2);
      const inner = (
        <>
          <div className={hasImg && s.imageSide === "left" ? "lg:order-2" : ""}>
            {s.heading &&
              (compact ? (
                <h3 className="mb-3 font-serif text-[22px] font-semibold sm:text-[24px]">
                  {s.heading}
                </h3>
              ) : (
                <h2 className="mb-4 font-serif text-[26px] font-semibold sm:text-[30px]">
                  {s.heading}
                </h2>
              ))}
            {two && <span aria-hidden className="mb-4 block h-1 w-14 rounded-full bg-accent" />}
            <Paragraphs body={s.body} />
          </div>
          {two ? (
            <TwoPhotos
              a={{ url: s.image, caption: s.caption || s.heading }}
              b={{ url: s.image2!, caption: s.caption2 || "" }}
            />
          ) : (
            hasImg && (
              <figure>
                <Photo src={s.image} alt={s.caption || s.heading} />
                {s.caption && (
                  <figcaption className="mt-2 text-[13px] text-muted-foreground">
                    {s.caption}
                  </figcaption>
                )}
              </figure>
            )
          )}
        </>
      );
      const grid = `grid items-center gap-8 ${hasImg ? "lg:grid-cols-2 lg:gap-12" : "max-w-[75ch]"}`;
      if (compact) return <div className={`py-6 ${grid}`}>{inner}</div>;
      return (
        <section className={`py-12 sm:py-14 ${tone}`}>
          <Reveal className={`wrap ${grid}`}>{inner}</Reveal>
        </section>
      );
    }
    case "cards":
      if (!s.items.length && !s.image) return null;
      return (
        <Frame tone={tone} compact={compact}>
          <SectionTop
            heading={s.heading}
            intro={s.intro}
            image={s.image}
            caption={s.caption}
            compact={compact}
          />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {s.items.map((c, i) => (
              <Reveal key={i} as="li" delay={Math.min(i, 6) * 50} className="flex">
                <article className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card">
                  {c.image && <ShapedImage url={c.image} alt={c.title} maxPortraitHeight={false} />}
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
        </Frame>
      );
    case "gallery":
      if (!s.images.length) return null;
      return (
        <Frame tone={tone} compact={compact}>
          <Head title={s.heading} compact={compact} />
          <PhotoGallery images={s.images} label={s.heading || "Photo"} />
        </Frame>
      );
    case "list": {
      if (!s.items.length && !s.image) return null;
      const bulleted = s.style === "bulleted";
      return (
        <Frame tone={tone} compact={compact} narrow={!s.image}>
          <SectionTop
            heading={s.heading}
            intro={s.intro}
            image={s.image}
            caption={s.caption}
            compact={compact}
          />
          {bulleted ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {s.items.map((t, i) => (
                <Reveal key={i} as="li" delay={Math.min(i, 8) * 40}>
                  <div className="flex h-full items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
                    <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
                    <ListText text={t} plain />
                  </div>
                </Reveal>
              ))}
            </ul>
          ) : (
            <ol className="space-y-3">
              {s.items.map((t, i) => (
                <Reveal key={i} as="li" delay={Math.min(i, 8) * 50}>
                  <div className="flex items-start gap-4 rounded-lg border border-border bg-card px-5 py-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-serif text-[16px] font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <ListText text={t} />
                  </div>
                </Reveal>
              ))}
            </ol>
          )}
          {s.outro && (
            <p className="mt-8 max-w-[70ch] text-[15.5px] whitespace-pre-line text-muted-foreground">
              {s.outro}
            </p>
          )}
        </Frame>
      );
    }
    case "projects":
      return (
        <Frame tone={tone} compact={compact}>
          <Head title={s.heading || "Community projects"} compact={compact} />
          {s.intro && <p className="-mt-3 mb-8 max-w-[70ch] text-muted-foreground">{s.intro}</p>}
          <ProjectsList projects={data.projects} />
        </Frame>
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
                          <span>{x.text}</span>
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
    case "finder":
      return <ProjectFinder areas={data.areas ?? []} heading={s.heading} intro={s.intro} />;
    // Topic and areas sections are shown as the local-government tabs (see LgaTabs).
    default:
      return null;
  }
}

/** Two photos of one story: the main one large, the second overlapping its corner. */
function TwoPhotos({
  a,
  b,
}: {
  a: { url: string; caption: string };
  b: { url: string; caption: string };
}) {
  return (
    <figure>
      <div className="relative pb-14 sm:pr-10 sm:pb-20">
        <ShapedImage
          url={a.url}
          alt={a.caption}
          className="rounded-lg border border-border shadow-sm"
        />
        <div className="absolute right-0 bottom-0 w-[52%] overflow-hidden rounded-lg border-4 border-card shadow-lg">
          <ShapedImage url={b.url} alt={b.caption} fallback="landscape" />
        </div>
        <span
          aria-hidden
          className="absolute -top-3 -left-3 -z-10 size-24 rounded-lg bg-accent/25"
        />
      </div>
      {(a.caption || b.caption) && (
        <figcaption className="mt-3 space-y-1 text-[13px] text-muted-foreground">
          {a.caption && <span className="block">{a.caption}</span>}
          {b.caption && b.caption !== a.caption && <span className="block">{b.caption}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** One tab per page linked under this page in the menu, showing that page's content. */
function SubpageTabs({ s, data }: { s: PageSection; data: PageData }) {
  const subs = data.subpages ?? [];
  const [sel, setSel] = useState(subs[0]?.slug ?? "");
  useEffect(() => {
    const h = window.location.hash.replace(/^#tab-/, "");
    if (subs.some((x) => x.slug === h)) {
      setSel(h);
      window.setTimeout(
        () => document.getElementById("subpage-tabs")?.scrollIntoView({ behavior: "smooth" }),
        350,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!subs.length) return null;
  const cur = subs.find((x) => x.slug === sel) ?? subs[0]!;
  return (
    <section id="subpage-tabs" className="scroll-mt-24 py-10 sm:py-12">
      <div className="wrap">
        {"heading" in s && s.heading && <SectionHead title={s.heading} />}
        {"intro" in s && s.intro && (
          <p className="-mt-3 mb-6 max-w-[70ch] text-muted-foreground">{s.intro}</p>
        )}
        <div
          role="tablist"
          aria-label="Sections"
          className="sticky top-[76px] z-10 -mx-4 flex gap-2 overflow-x-auto border-b border-border bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {subs.map((x) => {
            const on = x.slug === cur.slug;
            return (
              <button
                key={x.slug}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="subpage-panel"
                onClick={() => {
                  setSel(x.slug);
                  history.replaceState(null, "", `#tab-${x.slug}`);
                }}
                className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-[14px] font-semibold whitespace-nowrap transition-colors ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {x.label}
              </button>
            );
          })}
        </div>
        <div id="subpage-panel" role="tabpanel" aria-label={cur.label} className="pt-6">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-accent pb-3">
            <h2 className="font-serif text-[26px] font-semibold sm:text-[30px]">{cur.title}</h2>
            <a
              href={`/${cur.slug}`}
              className="text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
            >
              Open as a page →
            </a>
          </div>
          {cur.intro && (
            <p className="mt-4 max-w-[70ch] text-[16px] whitespace-pre-line text-muted-foreground">
              {cur.intro}
            </p>
          )}
          {cur.sections
            .filter((x) => x.type !== "subpages")
            .map((x, i) => (
              <div key={`${cur.slug}-${i}`} className={i > 0 ? "border-t border-border" : ""}>
                <Section s={x} data={data} index={0} compact />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

const tabSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Page sections grouped into named tabs (set per section in the CMS). */
function SectionTabs({ page, data }: { page: SitePage; data: PageData }) {
  const names = [...new Set(page.sections.map((s) => s.tab).filter((t): t is string => !!t))];
  const [sel, setSel] = useState(names[0] ?? "");
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace(/^#tab-/, "");
      const t = names.find((n) => tabSlug(n) === h);
      if (!t) return;
      setSel(t);
      window.setTimeout(
        () => document.getElementById("page-tabs")?.scrollIntoView({ behavior: "smooth" }),
        350,
      );
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names.join("|")]);
  const current = page.sections.filter((s) => s.tab === sel);
  return (
    <section id="page-tabs" className="scroll-mt-24 py-10 sm:py-12">
      <div className="wrap">
        <div
          role="tablist"
          aria-label="Sections"
          className="sticky top-[76px] z-10 -mx-4 flex gap-2 overflow-x-auto border-b border-border bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {names.map((n) => {
            const on = n === sel;
            return (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="page-tab-panel"
                onClick={() => {
                  setSel(n);
                  history.replaceState(null, "", `#tab-${tabSlug(n)}`);
                }}
                className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-[14px] font-semibold whitespace-nowrap transition-colors ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div id="page-tab-panel" role="tabpanel" aria-label={sel} className="pt-2">
          {current.map((s, i) => (
            <div key={`${sel}-${i}`} className={i > 0 ? "border-t border-border" : ""}>
              <Section s={s} data={data} index={0} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const COMMON = new Set(
  "construction renovation completed ongoing classroom classrooms blocks block school schools primary grammar secondary community basic high market markets solar powered streetlights lighting police station divisional headquarters local government area provision donation distribution installation office furniture with and the of at in for to a an".split(
    " ",
  ),
);
/** Distinctive words (place and school names) in a piece of text. */
function names(text: string): string[] {
  return (text.match(/[A-Z][A-Za-z'-]{3,}/g) ?? [])
    .map((w) => w.toLowerCase())
    .filter((w) => !COMMON.has(w) && !LGAS.some((l) => l.toLowerCase().includes(w)) && w !== "oyo");
}
/** All the words a section shows, to avoid repeating an achievement it already lists. */
function sectionText(s: PageSection): string {
  return JSON.stringify(s).toLowerCase();
}

type LgaContent = {
  sections: PageSection[];
  achievements: { text: string; image: string }[];
  areas: AreaSection[];
};

/** One tab per local government, grouped by zone, holding everything tagged with it. */
function LgaTabs({ page, data }: { page: SitePage; data: PageData }) {
  const hub = page.sections.find((s) => s.type === "topic" || s.type === "areas");
  const topic = page.sections.find((s) => s.type === "topic");
  const content = useMemo(() => {
    const map = new Map<string, LgaContent>(
      LGAS.map((l) => [l, { sections: [], achievements: [], areas: [] }]),
    );
    for (const s of page.sections) if (s.lga) map.get(s.lga)?.sections.push(s);
    if (topic?.type === "topic") {
      const rule = TOPIC_RULES[topic.topic];
      for (const c of data.cards) {
        if (isSenate(c)) continue;
        const l = matchLga(c.title);
        if (!l) continue;
        const here = map.get(l)!;
        const said = here.sections.map(sectionText).join(" ");
        // Skip achievements the tab already lists (same school, market or place name).
        here.achievements.push(
          ...c.items.filter(
            (it) => rule.test(it.text) && !names(it.text).some((w) => said.includes(w)),
          ),
        );
      }
    }
    if (page.sections.some((s) => s.type === "areas"))
      for (const a of data.areas ?? []) if (a.section.lga) map.get(a.section.lga)?.areas.push(a);
    return map;
  }, [page.sections, topic, data.cards, data.areas]);

  const count = (l: string) => {
    const c = content.get(l)!;
    return c.sections.length + c.achievements.length + c.areas.length;
  };
  const first = LGAS.find((l) => count(l) > 0) ?? LGAS[0]!;
  const [sel, setSel] = useState(first);

  // A link like /outreach#lga-oyo-east opens that local government's tab.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace(/^#lga-/, "");
      const l = LGAS.find((x) => lgaSlug(x) === h);
      if (!l) return;
      setSel(l);
      // After the router has finished its own scrolling.
      window.setTimeout(
        () => document.getElementById("local-governments")?.scrollIntoView({ behavior: "smooth" }),
        350,
      );
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const c = content.get(sel)!;
  const byPage = new Map<string, AreaSection[]>();
  for (const a of c.areas) byPage.set(a.slug, [...(byPage.get(a.slug) ?? []), a]);
  const empty = count(sel) === 0;

  return (
    <section
      className="scroll-mt-24 border-y border-border bg-paper-2 py-12 sm:py-14"
      id="local-governments"
    >
      <div className="wrap">
        <SectionHead
          eyebrow="Local government by local government"
          title={hub?.heading || "Projects by local government"}
        />
        {hub?.intro && <p className="-mt-3 mb-6 max-w-[70ch] text-muted-foreground">{hub.intro}</p>}

        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:p-5 lg:grid-cols-[1.25fr_1fr_.6fr]">
          {ZONES.map((z) => (
            <div key={z.zone} role="tablist" aria-label={`${z.zone} zone`}>
              <div className="mb-2 text-[11.5px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
                {z.zone} zone
              </div>
              <div className="flex flex-wrap gap-2">
                {z.lgas.map((l) => {
                  const n = count(l);
                  const on = sel === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-controls="lga-panel"
                      onClick={() => setSel(l)}
                      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : n
                            ? "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                            : "border-dashed border-border bg-card text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {l}
                      {n > 0 && (
                        <span
                          className={`grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${
                            on ? "bg-accent text-primary-deep" : "bg-primary-tint text-primary"
                          }`}
                        >
                          {n}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div id="lga-panel" role="tabpanel" aria-label={`${sel} Local Government`} className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-accent pb-3">
            <h3 className="font-serif text-[26px] font-semibold sm:text-[30px]">
              {sel} Local Government
            </h3>
            <span className="text-[12px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
              {zoneOf(sel)} zone
            </span>
          </div>

          {empty && (
            <p className="mt-6 rounded-lg border border-dashed border-border bg-card px-5 py-6 text-muted-foreground">
              Projects in {sel} will be added here soon.
            </p>
          )}

          {c.sections.map((s, i) => (
            <Section key={`s${i}`} s={s} data={data} index={0} compact />
          ))}

          {[...byPage.entries()].map(([slug, list]) => (
            <div key={slug} className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-[12px] font-extrabold tracking-[0.08em] text-primary uppercase">
                  {list[0]!.page}
                </h4>
                <a
                  href={`/${slug}#lga-${lgaSlug(sel)}`}
                  className="text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Open the {list[0]!.page} page →
                </a>
              </div>
              {list.map((a, i) => (
                <Section key={i} s={a.section} data={data} index={0} compact />
              ))}
            </div>
          ))}

          {c.achievements.length > 0 && (
            <div className="py-6">
              <h3 className="mb-4 font-serif text-[22px] font-semibold sm:text-[24px]">
                More delivered in {sel}
              </h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {c.achievements.map((it, i) => (
                  <Reveal key={i} as="li" delay={Math.min(i, 7) * 50} className="flex">
                    <AchievementTile text={it.text} image={it.image} />
                  </Reveal>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          See every local government's record on the{" "}
          <Link
            to="/achievements"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            achievements page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export function PageView({ page, data }: { page: SitePage; data: PageData }) {
  const tabsAt = page.sections.findIndex(inTabs);
  const namedAt = page.sections.findIndex((s) => Boolean(s.tab));
  const usesStatus = page.sections.some(
    (s) => (s.type === "list" && s.items.some((t) => parseStatus(t).status)) || s.type === "finder",
  );
  let n = 0;
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
            {usesStatus && <StatusLegend className="mt-5" />}
          </div>
          {page.heroImage && (
            <ShapedImage
              url={page.heroImage}
              alt={page.heroAlt || page.title}
              loading="eager"
              className="rounded-lg border border-border"
            />
          )}
        </div>
      </section>

      {page.sections.map((s, i) => {
        if (i === tabsAt) {
          n = 0;
          return <LgaTabs key="lga-tabs" page={page} data={data} />;
        }
        if (s.type === "subpages") return <SubpageTabs key={`sub-${i}`} s={s} data={data} />;
        if (i === namedAt) {
          n = 0;
          return <SectionTabs key="named-tabs" page={page} data={data} />;
        }
        if (inTabs(s) || s.tab) return null;
        return <Section key={i} s={s} data={data} index={n++} />;
      })}

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
