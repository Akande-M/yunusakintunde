import { useMemo, useState } from "react";
import type { Commitment } from "@/lib/site-data";
import { StatusStamp } from "./StatusStamp";
import { SectionHead } from "./ui";

/* Promises Kept (2023–2027) and the 2027 Agenda. Edited in Admin → Record & Agenda. */

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

export function PromiseTracker({ kept, agenda }: { kept: Commitment[]; agenda: Commitment[] }) {
  const [view, setView] = useState<"kept" | "next">("kept");
  const counts = useMemo(
    () => ({
      delivered: kept.filter((p) => p.status === "delivered").length,
      progress: kept.filter((p) => p.status === "progress").length,
      upcoming: kept.filter((p) => p.status === "upcoming").length,
      total: kept.length,
    }),
    [kept],
  );
  if (!kept.length && !agenda.length) return null;

  return (
    <section
      id="promises"
      className="scroll-mt-24 border-t border-border bg-paper-2 py-14 sm:py-16"
    >
      <div className="wrap">
        <SectionHead eyebrow="The accountability hub" title="Promises Kept. Plans Ahead." />
        <div
          role="tablist"
          aria-label="Promises and agenda"
          className="mb-8 inline-flex w-full max-w-lg rounded-sm border border-border bg-card p-1"
        >
          {(
            [
              ["kept", "Promises Kept (2023–2027)"],
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
                In 2023, Oyo Central was asked for a mandate on the strength of {counts.total}{" "}
                specific commitments. Here is where each one stands today, updated as work
                progresses, not only at election time.
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
              {kept.map((p, i) => (
                <CommitmentRow key={p.title} item={p} index={i} />
              ))}
            </ul>
          </div>
        ) : (
          <div key="next" className="rise-in">
            <p className="mb-7 max-w-[70ch] text-[15.5px] text-muted-foreground">
              Built directly on what is working in term one. It is not a new list of unrelated
              promises. Here is what a second term delivers for Oyo Central.
            </p>
            <ul className="border-t border-border">
              {agenda.map((p, i) => (
                <CommitmentRow key={p.title} item={p} index={i} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
