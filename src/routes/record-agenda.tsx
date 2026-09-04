import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AGENDA_2027,
  img,
  PROJECTS,
  PROJECT_REGIONS,
  PROMISES_KEPT,
  type Commitment,
} from "@/lib/site-data";
import { StatusStamp } from "@/components/site/StatusStamp";
import { Chip, PageHeader, SectionHead, SmartImage } from "@/components/site/ui";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/record-agenda")({
  head: () => ({
    meta: [
      { title: "Record & Agenda — Promises Kept, Plans Ahead | Akintunde 2027" },
      {
        name: "description",
        content:
          "Every 2023 commitment tracked with a status stamp — 9 of 9 delivered — plus the five-point 2027 agenda for Oyo Central.",
      },
      { property: "og:title", content: "Promises Kept. Plans Ahead. — Senator Akintunde" },
      {
        property: "og:description",
        content:
          "The accountability hub for Oyo Central: first-term record, Senate work, community projects and the 2027 agenda.",
      },
    ],
  }),
  component: RecordAgenda,
});

function CommitmentRow({ item, index }: { item: Commitment; index: number }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-x-5 gap-y-2 border-b border-border py-5 transition-colors hover:bg-card sm:grid-cols-[40px_minmax(0,1fr)_auto]">
      <span className="pt-0.5 font-serif text-[18px] font-semibold text-accent">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <h3 className="font-sans text-[16.5px] font-bold text-foreground">{item.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
      </div>
      <div className="col-start-2 sm:col-start-3">
        <StatusStamp status={item.status} label={item.statusLabel} />
      </div>
    </li>
  );
}

function RecordAgenda() {
  const [view, setView] = useState<"kept" | "next">("kept");
  const [region, setRegion] = useState<(typeof PROJECT_REGIONS)[number]>("All regions");

  const counts = useMemo(
    () => ({
      delivered: PROMISES_KEPT.filter((p) => p.status === "delivered").length,
      progress: PROMISES_KEPT.filter((p) => p.status === "progress").length,
      upcoming: PROMISES_KEPT.filter((p) => p.status === "upcoming").length,
      total: PROMISES_KEPT.length,
    }),
    [],
  );

  const projects = PROJECTS.filter((p) => region === "All regions" || p.region === region);

  return (
    <>
      <PageHeader
        eyebrow="The accountability hub"
        title="Promises Kept. Plans Ahead."
        lede="Every commitment made in 2023, tracked honestly — and the agenda for what a second term will deliver next."
      />

      <section className="py-12 sm:py-14">
        <div className="wrap">
          <Reveal className="mb-10 grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <figure className="overflow-hidden rounded-lg border border-border bg-card">
              <SmartImage
                src={img.portraitWhite}
                alt="Senator Yunus Abiodun Akintunde, PhD, in Oyo Central Senatorial District"
                ratio="aspect-[4/5]"
                imgClassName="object-[center_15%]"
                priority
              />
              <figcaption className="border-t border-border px-4 py-3 text-[13px] text-muted-foreground">
                Senator Yunus Abiodun Akintunde, PhD — Oyo Central Senatorial District
              </figcaption>
            </figure>
            <div>
              <p className="max-w-[62ch] text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
                In 2023, Oyo Central was asked for a mandate on the strength of a promise. Today,
                the record is measured in 38 delivered projects, 6 sponsored bills and 9 of 9
                commitments kept — with a clear plan to finish the job in a second term.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { n: "38", l: "Projects" },
                  { n: "6", l: "Bills" },
                  { n: "9/9", l: "Promises kept" },
                  { n: "12", l: "LGAs reached" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="border border-border bg-card px-3 py-4 text-center"
                  >
                    <div className="font-serif text-[22px] font-semibold text-primary-deep">
                      {s.n}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div
            role="tablist"
            aria-label="Record and agenda views"
            className="mb-8 inline-flex w-full max-w-lg rounded-sm border border-border bg-card p-1"
          >
            {(
              [
                ["kept", "Promises Kept (2023–2026)"],
                ["next", "2027 Agenda"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`min-h-11 flex-1 cursor-pointer rounded-sm px-3 text-[13.5px] font-bold transition-colors ${
                  view === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {view === "kept" ? (
            <div key="kept" className="rise-in">
              <div className="mb-9 grid gap-8 lg:grid-cols-2">
                <p className="max-w-[62ch] text-[15.5px] text-muted-foreground">
                  In 2023, Oyo Central was asked for a mandate on the strength of nine specific
                  commitments. Here is where each one stands today — updated as work progresses, not
                  only at election time.
                </p>
                <div className="flex flex-col gap-2.5 border border-border bg-card p-6">
                  {(
                    [
                      ["delivered", counts.delivered],
                      ["progress", counts.progress],
                      ["upcoming", counts.upcoming],
                    ] as const
                  ).map(([status, n]) => (
                    <div key={status} className="flex items-center justify-between">
                      <StatusStamp status={status} />
                      <span className="font-bold">
                        {n} of {counts.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <ul className="border-t border-border">
                {PROMISES_KEPT.map((p, i) => (
                  <CommitmentRow key={p.title} item={p} index={i} />
                ))}
              </ul>
            </div>
          ) : (
            <div key="next" className="rise-in">
              <p className="mb-7 max-w-[70ch] text-[15.5px] text-muted-foreground">
                Built directly on what is working in term one — not a new list of unrelated
                promises. Here is what a second term delivers for Oyo Central.
              </p>
              <ul className="border-t border-border">
                {AGENDA_2027.map((p, i) => (
                  <CommitmentRow key={p.title} item={p} index={i} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-paper-2 py-16">
        <div className="wrap">
          <SectionHead eyebrow="The evidence base" title="Senate record & community projects" />

          <div className="mb-10 hairline-grid grid sm:grid-cols-3">
            {[
              {
                k: "6 bills",
                t: "Sponsored or co-sponsored",
                d: "Including legislation on youth employability and energy access, over four years.",
              },
              {
                k: "3 committees",
                t: "Standing committee membership",
                d: "Power, Science & Technology, and Cooperation & Integration in Africa.",
              },
              {
                k: "14 town halls",
                t: "Constituency engagement",
                d: "Held across Ibadan, Oyo and Ogbomoso zones since inauguration.",
              },
            ].map((c) => (
              <div key={c.k} className="bg-card px-6 py-7">
                <span className="text-xs font-bold text-accent-deep">{c.k}</span>
                <h3 className="mt-2 text-[18px] font-semibold">{c.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>

          <div className="mb-7 flex flex-wrap gap-2.5">
            {PROJECT_REGIONS.map((r) => (
              <Chip key={r} active={region === r} onClick={() => setRegion(r)}>
                {r}
              </Chip>
            ))}
          </div>

          <ul className="grid gap-8 md:grid-cols-2">
            {projects.map((p) => (
              <li key={p.name} className="rise-in border border-border bg-card">
                <SmartImage src={p.image} alt={p.alt} className="border-b border-border" />
                <div className="px-5 py-5">
                  <h3 className="font-sans text-[15.5px] font-bold text-primary">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.place}</p>
                  <p className="mt-2 text-[13px] font-semibold text-accent-deep">{p.completed}</p>
                </div>
              </li>
            ))}
          </ul>
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">No projects listed for this zone yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
