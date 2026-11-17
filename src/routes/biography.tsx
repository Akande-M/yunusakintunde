import { createFileRoute } from "@tanstack/react-router";
import { useSiteImages } from "@/lib/use-settings";
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

const TIMELINE = [
  {
    year: "1999 – 2003",
    title: "Commissioner, Oyo State Civil Service Commission",
    note: "",
  },
  { year: "2011 – 2012", title: "Commissioner for Works & Transport, Oyo State", note: "" },
  { year: "2014 – 2015", title: "Executive Assistant to the Governor of Oyo State", note: "" },
  {
    year: "2015 – 2023",
    title: "Private sector & community development",
    note: "Trade Codes Limited, energy advisory and grassroots empowerment work.",
  },
  {
    year: "2023 – Present",
    title: "Senator, Oyo Central Senatorial District",
    note: "10th National Assembly. Seeking re-election in 2027.",
    current: true,
  },
];

const FACTS = [
  { n: "1962", l: "Born in Pakoyi, Oyo town" },
  { n: "Ph.D.", l: "Energy & Environmental Studies, UI" },
  { n: "2002", l: "Founded Trade Codes Limited" },
  { n: "APC", l: "All Progressives Congress candidate" },
];

function Biography() {
  const images = useSiteImages();
  return (
    <>
      <section className="border-b border-border bg-paper-2 py-12 sm:py-14">
        <div className="wrap grid items-center gap-10 lg:grid-cols-2">
          <div className="rise-in">
            <Eyebrow>Biography</Eyebrow>
            <h1 className="text-[28px] leading-tight font-semibold sm:text-[34px]">
              Senator Yunus Abiodun Akintunde, PhD
            </h1>
            <p className="mt-3.5 max-w-[62ch] text-[17px] text-muted-foreground">
              Sitting Senator, Oyo Central Senatorial District, since 2023, and seeking a second
              term in 2027. Businessman, academic and philanthropist from Onikanko Compound, Pakoyi,
              Oyo town.
            </p>
            <ApcBadge className="mt-6" />
          </div>
          <SmartImage
            src={images.bioTop}
            alt="Senator Yunus Abiodun Akintunde, PhD greeting supporters"
            ratio="aspect-[4/3]"
            priority
            className="rounded-lg"
          />
        </div>
      </section>

      <section className="border-b border-border py-10">
        <div className="wrap hairline-grid grid sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <Reveal key={f.l} delay={i * 80} className="bg-card px-5 py-6">
              <div className="font-serif text-[24px] font-semibold text-primary-deep">{f.n}</div>
              <div className="mt-1 text-[13px] font-semibold text-muted-foreground">{f.l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="wrap grid items-start gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-[22px] font-semibold">Early life & education</h2>
            <p className="mt-4 text-[15.5px] text-muted-foreground">
              Born 6 March 1962 in Onikanko Compound, Pakoyi, Oyo town. Educated at Ansar-ud-deen
              Model Primary School, Balogun Oyo, and Oranyan Grammar School, Oyo.
            </p>
            <p className="mt-4 text-[15.5px] text-muted-foreground">
              He holds an OND and a BSc in Physics (The Polytechnic, Ibadan and Lagos State
              University), an MSc in Public Administration and an MSc in Energy Studies (LASU), and
              a Ph.D. in Energy and Environmental Studies from the University of Ibadan. He is the
              first Nigerian to hold that doctorate.
            </p>

            <h2 className="mt-9 text-[22px] font-semibold">Business & public service</h2>
            <p className="mt-4 text-[15.5px] text-muted-foreground">
              MD/CEO of Trade Codes Limited, founded in 2002, which has created over 30 permanent
              jobs and empowered more than 300 people across infrastructure delivery, energy
              advisory and upskilling. That operating experience shapes how the constituency office
              is run today: projects scoped, costed, delivered and reported back.
            </p>
            <p className="mt-4 text-[15.5px] text-muted-foreground">
              Since taking his seat in the 10th National Assembly he has sponsored or co-sponsored
              six bills, held 14 town halls, and facilitated 38 community projects across the
              district.
            </p>
            <figure className="mt-8">
              <SmartImage
                src={images.bioSecond}
                alt="Senator Yunus Abiodun Akintunde, PhD in a cap and polo shirt"
                ratio="aspect-[4/5] sm:aspect-[4/3]"
                imgClassName="object-[center_12%]"
                className="rounded-lg"
              />
              <figcaption className="mt-2 text-[13px] text-muted-foreground">
                Senator Yunus Abiodun Akintunde, PhD, Oyo Central.
              </figcaption>
            </figure>
          </div>

          <div>
            <h2 className="mb-6 text-[16px] font-semibold">Timeline of public service</h2>
            <ol className="ml-1.5 border-l-2 border-border pl-8">
              {TIMELINE.map((t) => (
                <li key={t.year} className="relative pb-8 last:pb-0">
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
