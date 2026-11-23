import { createFileRoute } from "@tanstack/react-router";
import { useSiteImages, useSiteSettings } from "@/lib/use-settings";
import { toParagraphs } from "@/lib/cms";
import { Eyebrow, SmartImage } from "@/components/site/ui";
import { ApcBadge } from "@/components/site/ApcBadge";
import { Reveal } from "@/components/site/Reveal";

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
  const [first, ...rest] = bio.sections;
  const textBlock = (sec: { heading: string; body: string }, i: number) => (
    <div key={i} className={i > 0 ? "mt-9" : ""}>
      {sec.heading && <h2 className="text-[22px] font-semibold">{sec.heading}</h2>}
      {toParagraphs(sec.body).map((p, j) => (
        <p key={j} className="mt-4 text-[15.5px] whitespace-pre-line text-muted-foreground">
          {p}
        </p>
      ))}
    </div>
  );
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

      <section className="py-16">
        <div className="wrap grid items-start gap-12 lg:grid-cols-2">
          <div>
            {first && textBlock(first, 0)}
            {rest.map((sec, i) => textBlock(sec, i + 1))}
            <figure className="mt-8">
              <SmartImage
                src={images.bioSecond}
                alt={bio.photoCaption || bio.title}
                ratio="aspect-[4/5] sm:aspect-[4/3]"
                imgClassName="object-[center_12%]"
                className="rounded-lg"
              />
              <figcaption className="mt-2 text-[13px] text-muted-foreground">
                {bio.photoCaption}
              </figcaption>
            </figure>
          </div>

          <div>
            <h2 className="mb-6 text-[16px] font-semibold">{bio.timelineHeading}</h2>
            <ol className="ml-1.5 border-l-2 border-border pl-8">
              {bio.timeline.map((t, i) => (
                <li key={`${t.year}-${i}`} className="relative pb-8 last:pb-0">
                  <span
                    aria-hidden
                    className={`absolute top-1 -left-[37px] size-2.5 rounded-full border-[3px] border-paper ${
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
