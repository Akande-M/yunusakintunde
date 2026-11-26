/*
 * Project status labels, used the same way everywhere: Completed, Ongoing, Awarded, Planned.
 * In page lists an item gets a label by starting with it in square brackets, e.g.
 * "[Ongoing] Ayegun–Oleyo Road: Rehabilitation of the 17-kilometre road."
 * Items without a label are shown without one (status not yet confirmed by the office).
 */
export const STATUSES = ["Completed", "Ongoing", "Awarded", "Planned"] as const;
export type ProjectStatusName = (typeof STATUSES)[number];

const STYLE: Record<ProjectStatusName, string> = {
  Completed: "bg-primary text-primary-foreground",
  Ongoing: "bg-accent text-primary-deep",
  Awarded: "bg-sky-100 text-sky-900 ring-1 ring-sky-300",
  Planned: "bg-muted text-foreground ring-1 ring-border",
};

const RE = /^\s*\[(completed|ongoing|awarded|planned)\]\s*/i;

/** Splits "[Ongoing] Text" into its status and the rest. */
export function parseStatus(text: string): { status: ProjectStatusName | null; rest: string } {
  const m = RE.exec(text);
  if (!m) return { status: null, rest: text };
  const word = m[1]!.toLowerCase();
  const status = STATUSES.find((s) => s.toLowerCase() === word) ?? null;
  return { status, rest: text.slice(m[0].length) };
}

export function asStatus(v: string | undefined | null): ProjectStatusName | null {
  return STATUSES.find((s) => s.toLowerCase() === (v ?? "").trim().toLowerCase()) ?? null;
}

export function StatusBadge({
  status,
  className = "",
}: {
  status: ProjectStatusName;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-extrabold tracking-[0.04em] uppercase ${STYLE[status]} ${className}`}
    >
      {status}
    </span>
  );
}

/** The key to the labels, shown once on pages that use them. */
export function StatusLegend({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground ${className}`}
    >
      <span className="font-semibold text-foreground">Project status:</span>
      {STATUSES.map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
      <span>Items without a label are awaiting confirmation from the office.</span>
    </p>
  );
}
