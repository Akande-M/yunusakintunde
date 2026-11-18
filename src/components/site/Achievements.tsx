import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Droplets,
  Gavel,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Laptop,
  Lightbulb,
  Route,
  School,
  Scissors,
  ScrollText,
  Smartphone,
  Stethoscope,
  Tractor,
  Users,
  Wrench,
} from "lucide-react";
import type { AchievementCard } from "@/lib/achievements-data";
import { AutoCarousel } from "@/components/site/AutoCarousel";
import { Eyebrow } from "@/components/site/ui";
import { Reveal } from "@/components/site/Reveal";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/** Picks an icon from the wording, so editors never have to choose one. Order matters. */
const ICON_RULES: [RegExp, Icon][] = [
  [/\b(bill|act)\b.*\b(19|20)\d{2}\b/i, ScrollText],
  [/streetlight/i, Lightbulb],
  [/borehole|water/i, Droplets],
  [/scholarship|tuition/i, GraduationCap],
  [/\bGSM\b/i, Smartphone],
  [/\bICT\b|tablet/i, Laptop],
  [/tractor|farm/i, Tractor],
  [/hospital/i, Building2],
  [/medical|health/i, Stethoscope],
  [/tailoring|sewing/i, Scissors],
  [/grinding|welding|mechanic|tool/i, Wrench],
  [/road|drainage/i, Route],
  [/cash|grant/i, Banknote],
  [/women|girls/i, HeartHandshake],
  [/mosque|church|market|palace|worship/i, Landmark],
  [/classroom|school/i, School],
  [/\bbill\b|\bact\b/i, ScrollText],
  [/motion|appeal|halt/i, Gavel],
  [/youth|empower|training|beneficiar/i, Users],
];

function iconFor(text: string): Icon {
  return ICON_RULES.find(([re]) => re.test(text))?.[1] ?? CheckCircle2;
}

/** Bolds the figures (714, ₦50,000, 8km…) so the scale reads at a glance. Years and bill numbers stay plain. */
function Emphasised({ text }: { text: string }) {
  const parts = text.split(/(₦[\d,]+|\b\d[\d,]*(?:km)?\b)/g);
  return (
    <>
      {parts.map((p, i) => {
        const isFigure = i % 2 === 1;
        const prev = parts[i - 1] ?? "";
        const plain = /^(19|20)\d{2}$/.test(p) || /SB\.$/i.test(prev);
        return isFigure && !plain ? (
          <strong key={i} className="font-bold text-primary-deep">
            {p}
          </strong>
        ) : (
          p
        );
      })}
    </>
  );
}

function LgaCard({ card }: { card: AchievementCard }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  // Replays the one-by-one reveal every time this card slides into view.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setActive(!!e && e.intersectionRatio > 0.6), {
      threshold: [0, 0.6, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const legislative = card.zone.toLowerCase() === "senate";

  return (
    <article
      ref={ref}
      className="grid h-full overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[300px_minmax(0,1fr)]"
    >
      <header className="relative flex flex-col justify-between gap-6 bg-primary-deep p-6 text-on-dark sm:p-8">
        <div>
          <span className="inline-block rounded-sm bg-accent px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-primary-deep uppercase">
            {legislative ? "In the Senate" : `${card.zone} zone`}
          </span>
          <h3 className="mt-4 font-serif text-[28px] leading-tight font-semibold text-on-dark sm:text-[32px]">
            {card.title}
          </h3>
          <p className="mt-2 text-[13.5px] text-on-dark-muted">
            <span className="font-serif text-[40px] leading-none font-semibold text-accent">
              {card.items.length}
            </span>{" "}
            {card.heading.replace(/^\s*\d+\s*/, "").toLowerCase()}
          </p>
        </div>
        {card.extraItems.length > 0 && (
          <div className="border-t border-on-dark-line pt-4">
            <div className="mb-2 text-[11.5px] font-bold tracking-[0.08em] text-accent uppercase">
              {card.extraHeading || "Also"}
            </div>
            <ul className="space-y-1.5 text-[13px] text-on-dark">
              {card.extraItems.map((x, i) => (
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
      </header>
      <ol className="grid content-start gap-x-6 gap-y-1 p-5 sm:p-7 md:grid-cols-2">
        {card.items.map((item, i) => {
          const Ico = iconFor(item);
          return (
            <li
              key={i}
              style={{ transitionDelay: active ? `${i * 110}ms` : "0ms" }}
              className={`flex items-start gap-3 border-b border-border/70 py-3 transition-all duration-500 ease-out ${
                active ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
              }`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
                {i + 1}
              </span>
              <Ico className="mt-0.5 size-5 shrink-0 text-accent-deep" aria-hidden />
              <span className="text-[14px] leading-snug text-foreground">
                <Emphasised text={item} />
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

export function AchievementsSection({ cards }: { cards: AchievementCard[] }) {
  if (cards.length === 0) return null;
  const lgas = cards.filter((c) => c.zone.toLowerCase() !== "senate").length;
  return (
    <section className="bg-paper-2 py-16 sm:py-20" aria-labelledby="achievements-title">
      <div className="wrap">
        <Reveal className="mb-8 max-w-[62ch]">
          <Eyebrow>Major achievements</Eyebrow>
          <h2
            id="achievements-title"
            className="mt-3 font-serif text-[30px] leading-tight font-semibold text-primary-deep sm:text-[38px]"
          >
            10 major achievements in every local government
          </h2>
          <p className="mt-3 text-[15.5px] text-muted-foreground">
            Project by project, across {lgas} local governments in Oyo Central, plus the Senator's
            work on the floor of the Senate.
          </p>
        </Reveal>
        <AutoCarousel label="Major achievements by local government" interval={9000} arrows>
          {cards.map((c) => (
            <LgaCard key={c.title} card={c} />
          ))}
        </AutoCarousel>
      </div>
    </section>
  );
}
