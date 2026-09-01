import type { StatusKey } from "@/lib/site-data";

const STYLES: Record<StatusKey, { wrap: string; dot: string; label: string }> = {
  delivered: {
    wrap: "bg-primary-tint text-primary-deep",
    dot: "bg-primary",
    label: "Delivered",
  },
  progress: {
    wrap: "bg-accent-tint text-accent-hover",
    dot: "bg-accent",
    label: "In progress",
  },
  upcoming: {
    wrap: "bg-neutral-tint text-neutral-ink",
    dot: "bg-neutral-dot",
    label: "Upcoming",
  },
};

export function StatusStamp({
  status,
  label,
  className = "",
}: {
  status: StatusKey;
  label?: string;
  className?: string;
}) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1 text-[12.5px] font-bold whitespace-nowrap ${s.wrap} ${className}`}
    >
      <span aria-hidden className={`size-[7px] rounded-full ${s.dot}`} />
      {label ?? s.label}
    </span>
  );
}

export const statusLabelOf = (s: StatusKey) => STYLES[s].label;
