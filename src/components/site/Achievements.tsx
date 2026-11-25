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
import { Link } from "@tanstack/react-router";
import type { AchievementCard } from "@/lib/achievements-data";
import { useSiteSettings } from "@/lib/use-settings";
import { btn } from "@/components/site/ui";
import { AutoCarousel } from "@/components/site/AutoCarousel";
import { Eyebrow } from "@/components/site/ui";
import { Reveal } from "@/components/site/Reveal";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/** Picks an icon (and a short label) from the wording, so editors never have to choose one. Order matters. */
const ICON_RULES: [RegExp, Icon, string][] = [
  [/\b(bill|act)\b.*\b(19|20)\d{2}\b/i, ScrollText, "Bill"],
  [/streetlight|solar lighting/i, Lightbulb, "Solar streetlights"],
  [/borehole|water/i, Droplets, "Water"],
  [/scholarship|tuition/i, GraduationCap, "Scholarships"],
  [/\bGSM\b/i, Smartphone, "GSM repair training"],
  [/\bICT\b|tablet/i, Laptop, "ICT training"],
  [/tractor|farm/i, Tractor, "Agriculture"],
  [/hospital/i, Building2, "Health"],
  [/medical|health/i, Stethoscope, "Health"],
  [/tailoring|sewing/i, Scissors, "Tailoring"],
  [/grinding|welding|mechanic|tool/i, Wrench, "Artisans"],
  [/road|drainage/i, Route, "Roads"],
  [/cash|grant/i, Banknote, "Grants"],
  [/women|girls/i, HeartHandshake, "Women & girls"],
  [/mosque|church|market|palace|worship/i, Landmark, "Community buildings"],
  [/classroom|school/i, School, "Education"],
  [/\bbill\b|\bact\b/i, ScrollText, "Bill"],
  [/motion|appeal|halt/i, Gavel, "Motion"],
  [/youth|empower|training|beneficiar/i, Users, "Empowerment"],
];

export function iconFor(text: string): Icon {
  return ICON_RULES.find(([re]) => re.test(text))?.[1] ?? CheckCircle2;
}

/**
 * Picture for an achievement with no photo yet: a branded panel with the item's icon and its
 * headline figure, so no tile is ever blank. A real photo added in the CMS replaces it.
 */
export function ItemArt({ text, className = "" }: { text: string; className?: string }) {
  const rule = ICON_RULES.find(([re]) => re.test(text));
  const Ico = rule?.[1] ?? CheckCircle2;
  const label = rule?.[2] ?? "Delivered";
  // The headline figure, e.g. 714 or ₦50,000 (not "3-day" or a year).
  const figure = text.match(/₦[\d,]+|\b\d[\d,]*(?:km)?\b(?!-)/)?.[0];
  const showFigure = figure && !/^(19|20)\d{2}$/.test(figure);
  return (
    <div
      aria-hidden
      className={`relative grid aspect-[4/3] w-full place-items-center overflow-hidden bg-primary-deep text-on-dark ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,.09) 1px, transparent 0)",
        backgroundSize: "18px 18px",
      }}
    >
      <Ico className="absolute -right-5 -bottom-5 size-36 text-on-dark/[.07]" aria-hidden />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <span className="grid size-14 place-items-center rounded-full border-2 border-accent/70 bg-on-dark/5">
          <Ico className="size-7 text-accent" aria-hidden />
        </span>
        {showFigure && (
          <span className="font-serif text-[30px] leading-none font-semibold text-accent">
            {figure}
          </span>
        )}
        <span className="text-[11px] font-extrabold tracking-[0.12em] text-on-dark/80 uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}

/** Bolds the figures (714, ₦50,000, 8km…) so the scale reads at a glance. Years and bill numbers stay plain. */
export function Emphasised({ text }: { text: string }) {
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

/** The flyer's "LET'S DO MORE" sign-off: the Senator's portrait with the stacked tagline and a red swoosh. */
export function LetsDoMore({
  portrait,
  tagline,
  compact = false,
}: {
  portrait: string;
  tagline: string;
  compact?: boolean;
}) {
  const words = tagline.toUpperCase().split(/\s+/).filter(Boolean);
  return (
    <div className="flex items-center gap-4 rounded-lg bg-paper p-3 pr-4 text-left">
      <span
        className={`shrink-0 overflow-hidden rounded-full border-4 border-accent bg-paper ${compact ? "size-20" : "size-24"}`}
      >
        <img
          src={portrait}
          alt="Senator Yunus Abiodun Akintunde, PhD"
          className="size-full object-cover object-[50%_18%]"
          loading="lazy"
        />
      </span>
      {words.length > 0 && (
        <span className="relative inline-block pb-2">
          <span
            className={`block font-sans leading-[0.92] font-black tracking-tight text-[#8f1d24] italic ${compact ? "text-[22px]" : "text-[26px]"}`}
          >
            {words.map((w, i) => (
              <span key={i} className="block">
                {w}
              </span>
            ))}
          </span>
          <svg
            aria-hidden
            viewBox="0 0 120 14"
            className="absolute -bottom-0.5 left-0 h-3 w-[110%]"
            preserveAspectRatio="none"
          >
            <path
              d="M2 11 C 40 3, 80 2, 118 4"
              fill="none"
              stroke="#d3262f"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
    </div>
  );
}

function LgaCard({ card }: { card: AchievementCard }) {
  const { achievements: page } = useSiteSettings();
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
        <div className="space-y-5">
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
                    {x.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {page.portrait && <LetsDoMore portrait={page.portrait} tagline={page.tagline} compact />}
        </div>
      </header>
      <ol className="grid content-start gap-x-6 gap-y-1 p-5 sm:p-7 md:grid-cols-2">
        {card.items.map((item, i) => {
          const Ico = iconFor(item.text);
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
                <Emphasised text={item.text} />
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

export function AchievementsSection({ cards }: { cards: AchievementCard[] }) {
  const pageTitle = useSiteSettings().achievements.pageTitle;
  if (cards.length === 0) return null;
  const lgas = cards.filter((c) => c.zone.toLowerCase() !== "senate").length;
  return (
    <section className="bg-paper-2 py-16 sm:py-20" aria-labelledby="achievements-title">
      <div className="wrap">
        <Reveal className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[62ch]">
            <Eyebrow>Major achievements</Eyebrow>
            <h2
              id="achievements-title"
              className="mt-3 font-serif text-[30px] leading-tight font-semibold text-primary-deep sm:text-[38px]"
            >
              {pageTitle}
            </h2>
            <p className="mt-3 text-[15.5px] text-muted-foreground">
              Project by project, across {lgas} local governments in Oyo Central, plus the Senator's
              work on the floor of the Senate.
            </p>
          </div>
          <Link to="/achievements" className={`${btn.outline} shrink-0 self-start sm:self-auto`}>
            View all achievements →
          </Link>
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
