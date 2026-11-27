import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Commitment } from "@/lib/site-data";
import { SectionHead } from "./ui";

/*
 * The 2023 manifesto scorecard: each promise, its status and what was actually done.
 * Edited in Admin → Record & Agenda ("2023 promises"); the status shown comes from the
 * Label field (Delivered, Facilitated, Ongoing or Not yet delivered).
 */

export const SCORE_STATUSES = ["Delivered", "Facilitated", "Ongoing", "Not yet delivered"] as const;
export type ScoreStatus = (typeof SCORE_STATUSES)[number];

const STYLE: Record<ScoreStatus, { pill: string; bar: string; dot: string }> = {
  Delivered: { pill: "bg-primary text-primary-foreground", bar: "bg-primary", dot: "bg-primary" },
  Facilitated: { pill: "bg-accent text-primary-deep", bar: "bg-accent", dot: "bg-accent" },
  Ongoing: { pill: "bg-sky-700 text-white", bar: "bg-sky-700", dot: "bg-sky-700" },
  "Not yet delivered": {
    pill: "border border-foreground/30 bg-card text-foreground",
    bar: "bg-foreground/20",
    dot: "bg-foreground/30",
  },
};

export function scoreStatus(c: Commitment): ScoreStatus {
  const l = (c.statusLabel ?? "").trim().toLowerCase();
  const hit = SCORE_STATUSES.find((s) => s.toLowerCase() === l);
  if (hit) return hit;
  if (/not yet|not delivered/.test(l)) return "Not yet delivered";
  if (/facilitat/.test(l)) return "Facilitated";
  if (c.status === "delivered") return "Delivered";
  if (c.status === "progress") return "Ongoing";
  return "Not yet delivered";
}

/** Where the evidence for each promise lives on the site. */
function evidenceFor(
  title: string,
): { to: string; params?: { slug: string }; hash?: string; label: string } | null {
  const t = title.toLowerCase();
  if (/bill/.test(t))
    return { to: "/$slug", params: { slug: "bills-and-motions" }, label: "Bills & motions" };
  if (/senate|representation/.test(t))
    return {
      to: "/$slug",
      params: { slug: "committees-and-oversight" },
      label: "Committees & oversight",
    };
  if (/vocational|skills/.test(t))
    return {
      to: "/$slug",
      params: { slug: "skills-jobs-and-empowerment" },
      hash: "tab-skills-empowerment",
      label: "Skills & empowerment",
    };
  if (/job fair|employab|career/.test(t))
    return {
      to: "/$slug",
      params: { slug: "skills-jobs-and-empowerment" },
      hash: "tab-jobs-human-capital",
      label: "Jobs & employment",
    };
  if (/ict|tech/.test(t))
    return {
      to: "/$slug",
      params: { slug: "skills-jobs-and-empowerment" },
      hash: "tab-ict-centres",
      label: "ICT centres",
    };
  if (/office|secretariat/.test(t)) return { to: "/get-involved", label: "Contact the office" };
  if (/medical|health/.test(t))
    return { to: "/$slug", params: { slug: "outreach" }, label: "Healthcare & outreach" };
  if (/town hall|assembly|stakeholder|political/.test(t))
    return {
      to: "/$slug",
      params: { slug: "political-leadership-and-party-engagement" },
      label: "Political & party leadership",
    };
  if (/project/.test(t))
    return {
      to: "/$slug",
      params: { slug: "constituency-interventions-and-development-projects" },
      label: "Constituency projects",
    };
  return null;
}

function Row({
  item,
  index,
  projects,
  open,
  onToggle,
}: {
  item: Commitment;
  index: number;
  projects: number;
  open: boolean;
  onToggle: () => void;
}) {
  const st = scoreStatus(item);
  const ev = evidenceFor(item.title);
  const detail = item.detail.replace("{projects}", projects ? String(projects) : "");
  const id = `promise-${index}`;
  return (
    <li className="border-b border-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="grid w-full cursor-pointer grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-3 py-4 text-left sm:grid-cols-[36px_minmax(0,1fr)_auto_20px] sm:gap-x-4"
      >
        <span className="pt-0.5 font-serif text-[17px] font-semibold text-accent-deep">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 text-[15.5px] leading-snug font-bold text-foreground">
          {item.title}
        </span>
        <span
          className={`col-start-2 mt-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11.5px] font-extrabold tracking-[0.03em] uppercase sm:col-start-3 sm:mt-0 ${STYLE[st].pill}`}
        >
          {st}
        </span>
        <ChevronDown
          aria-hidden
          className={`hidden size-5 text-muted-foreground transition-transform sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div id={id} hidden={!open} className="pb-5 pl-[40px] sm:pl-[52px]">
        <p className="text-[14.5px] leading-relaxed text-muted-foreground">{detail}</p>
        {ev && (
          <Link
            to={ev.to}
            {...(ev.params ? { params: ev.params } : {})}
            {...(ev.hash ? { hash: ev.hash } : {})}
            className="mt-2 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-primary hover:underline"
          >
            See the evidence: {ev.label} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </li>
  );
}

/**
 * Interactive summary: a bar showing how many promises are delivered, facilitated, ongoing or
 * not yet delivered (click a status to filter), and the promises below, each opening to show
 * what was done. `compact` (homepage) opens one at a time; the full version opens them all.
 */
export function ManifestoScorecard({
  items,
  projects,
  compact = false,
  id = "scorecard",
}: {
  items: Commitment[];
  projects: number;
  compact?: boolean;
  id?: string;
}) {
  const [filter, setFilter] = useState<ScoreStatus | "All">("All");
  const [open, setOpen] = useState<number | "all" | null>(compact ? null : "all");
  const counts = useMemo(() => {
    const c = Object.fromEntries(SCORE_STATUSES.map((s) => [s, 0])) as Record<ScoreStatus, number>;
    for (const it of items) c[scoreStatus(it)]++;
    return c;
  }, [items]);
  if (!items.length) return null;
  const total = items.length;
  const shown = items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => filter === "All" || scoreStatus(it) === filter);

  return (
    <section id={id} className="scroll-mt-24 py-16 sm:py-19">
      <div className="wrap">
        <SectionHead
          eyebrow="Promises kept"
          title="2023 manifesto scorecard"
          action={
            compact ? (
              <Link
                to="/achievements"
                hash="scorecard"
                className="text-[14px] font-bold text-primary hover:underline"
              >
                Full scorecard on Achievements →
              </Link>
            ) : undefined
          }
        />
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="font-serif text-[44px] leading-none font-semibold text-primary-deep">
              {counts.Delivered + counts.Facilitated}
              <span className="text-[24px] text-muted-foreground"> of {total}</span>
            </p>
            <p className="mt-2 text-[15px] text-muted-foreground">
              promises delivered or facilitated, checked against the records of the Senator’s
              office.
            </p>
            <div
              className="mt-6 flex h-4 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={SCORE_STATUSES.map((s) => `${counts[s]} ${s}`).join(", ")}
            >
              {SCORE_STATUSES.map((s) =>
                counts[s] ? (
                  <span
                    key={s}
                    className={`h-full ${STYLE[s].bar} border-r-2 border-card last:border-r-0`}
                    style={{ width: `${(counts[s] / total) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-2">
              {SCORE_STATUSES.filter((s) => counts[s]).map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    aria-pressed={filter === s}
                    onClick={() => setFilter(filter === s ? "All" : s)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors ${
                      filter === s
                        ? "border-primary bg-primary-tint"
                        : "border-border bg-card hover:border-primary"
                    }`}
                  >
                    <span aria-hidden className={`size-3 shrink-0 rounded-full ${STYLE[s].dot}`} />
                    <span className="font-serif text-[22px] leading-none font-semibold">
                      {counts[s]}
                    </span>
                    <span className="text-[13px] leading-tight font-semibold text-muted-foreground">
                      {s}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12.5px] text-muted-foreground">
              Tap a status to filter the list. “Not yet delivered” promises show what was done
              instead.
            </p>
          </div>
          <div>
            {filter !== "All" && (
              <button
                type="button"
                onClick={() => setFilter("All")}
                className="mb-2 text-[13px] font-bold text-primary hover:underline"
              >
                Show all {total} promises
              </button>
            )}
            <ol className="border-t border-border">
              {shown.map(({ it, i }) => (
                <Row
                  key={i}
                  item={it}
                  index={i}
                  projects={projects}
                  open={open === "all" || open === i}
                  onToggle={() => setOpen(open === i ? null : open === "all" ? null : i)}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
