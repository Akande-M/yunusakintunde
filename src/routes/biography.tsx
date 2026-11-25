import { createFileRoute } from "@tanstack/react-router";
import { useSiteImages, useSiteSettings } from "@/lib/use-settings";
import { toParagraphs } from "@/lib/cms";
import { Eyebrow, SmartImage } from "@/components/site/ui";
import { ApcBadge } from "@/components/site/ApcBadge";
import { Reveal } from "@/components/site/Reveal";
import { ShapedImage } from "@/components/site/ShapedImage";

export const Route = createFileRoute("/biography")({
  head: () => ({
    meta: [
      { title: "Biography | Senator Yunus Abiodun Akintunde, PhD, Oyo Central" },
      {
        name: "description",
        content:
          "From Pakoyi, Oyo town to the 10th National Assembly: the education, business and public-service record of Senator Yunus Abiodun Akintunde, PhD.",
      },
      { property: "og:title", content: "Biography | Senator Yunus Abiodun Akintunde, PhD" },
      {
        property: "og:description",
        content:
          "Sitting Senator for Oyo Central since 2023, businessman, academic and philanthropist. Now seeking a second term.",
      },
    ],
  }),
  component: Biography,
});

function Biography() {
  const images = useSiteImages();
  const bio = useSiteSettings().biography;
  type Part = { heading: string; body: string; image?: string; caption?: string };
  /** One part of the story: text on one side, its photo on the other, alternating sides. */
  const row = (sec: Part, i: number) => {
    const photoLeft = i % 2 === 1;
    return (
      <Reveal
        key={i}
        className={`grid items-center gap-8 lg:gap-14 ${sec.image ? "lg:grid-cols-2" : "max-w-[75ch]"} ${
          i > 0 ? "mt-16 border-t border-border pt-16 sm:mt-20 sm:pt-20" : ""
        }`}
      >
        <div className={sec.image && photoLeft ? "lg:order-2" : ""}>
          {sec.heading && (
            <h2 className="font-serif text-[26px] leading-tight font-semibold text-primary-deep sm:text-[30px]">
              {sec.heading}
            </h2>
          )}
          <span aria-hidden className="mt-4 block h-1 w-14 rounded-full bg-accent" />
          {toParagraphs(sec.body).map((p, j) => (
            <p
              key={j}
              className="mt-4 text-[16px] leading-relaxed whitespace-pre-line text-muted-foreground"
            >
              {p}
            </p>
          ))}
        </div>
        {sec.image && (
          <figure className={`lg:sticky lg:top-28 ${photoLeft ? "lg:order-1" : ""}`}>
            <ShapedImage
              url={sec.image}
              alt={sec.caption || sec.heading}
              fallback="landscape"
              className="rounded-lg border border-border shadow-sm"
            />
            {sec.caption && (
              <figcaption className="mt-2 text-[13px] text-muted-foreground">
                {sec.caption}
              </figcaption>
            )}
          </figure>
        )}
      </Reveal>
    );
  };

  return (
    <>
      <section className="border-b border-border bg-paper-2 py-12 sm:py-14">
        <div className="wrap grid items-center gap-10 lg:grid-cols-2">
          <div className="rise-in">
            {bio.eyebrow && <Eyebrow>{bio.eyebrow}</Eyebrow>}
            <h1 className="text-[28px] leading-tight font-semibold sm:text-[34px]">{bio.title}</h1>
            <p className="mt-3.5 max-w-[62ch] text-[17px] whitespace-pre-line text-muted-foreground">
              {bio.intro}
            </p>
            {bio.showApcBadge && <ApcBadge className="mt-6" />}
          </div>
          <SmartImage
            src={images.bioTop}
            alt={`${bio.title} greeting supporters`}
            ratio="aspect-[4/3]"
            priority
            className="rounded-lg"
          />
        </div>
      </section>

      {bio.facts.length > 0 && (
        <section className="border-b border-border py-10">
          <div className="wrap hairline-grid grid sm:grid-cols-2 lg:grid-cols-4">
            {bio.facts.map((f, i) => (
              <Reveal key={f.l} delay={i * 80} className="bg-card px-5 py-6">
                <div className="font-serif text-[24px] font-semibold text-primary-deep">{f.n}</div>
                <div className="mt-1 text-[13px] font-semibold text-muted-foreground">{f.l}</div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="py-16 sm:py-20">
        <div className="wrap">{bio.sections.map((sec, i) => row(sec, i))}</div>
      </section>

      <section className="border-t border-border bg-paper-2 py-16 sm:py-20">
        <div className="wrap grid items-start gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <figure className="lg:sticky lg:top-28">
            <SmartImage
              src={images.bioSecond}
              alt={bio.photoCaption || bio.title}
              ratio="aspect-[4/5]"
              imgClassName="object-[center_12%]"
              className="rounded-lg"
            />
            {bio.photoCaption && (
              <figcaption className="mt-2 text-[13px] text-muted-foreground">
                {bio.photoCaption}
              </figcaption>
            )}
          </figure>
          <div>
            <Eyebrow>Career</Eyebrow>
            <h2 className="mb-8 font-serif text-[26px] font-semibold text-primary-deep sm:text-[30px]">
              {bio.timelineHeading}
            </h2>
            <ol className="ml-1.5 border-l-2 border-border pl-8">
              {bio.timeline.map((t, i) => (
                <li key={`${t.year}-${i}`} className="relative pb-8 last:pb-0">
                  <span
                    aria-hidden
                    className={`absolute top-1 -left-[37px] size-2.5 rounded-full border-[3px] border-paper-2 ${
                      t.current ? "bg-accent" : "bg-primary"
                    }`}
                  />
                  <div
                    className={`text-[13px] font-bold ${t.current ? "text-accent-deep" : "text-accent-deep/80"}`}
                  >
                    {t.year}
                  </div>
                  <h3 className="mt-0.5 font-sans text-[16px] font-bold text-foreground">
                    {t.title}
                  </h3>
                  {t.note && <p className="mt-1 text-[13.5px] text-muted-foreground">{t.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
