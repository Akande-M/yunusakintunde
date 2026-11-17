import { useSiteImages } from "@/lib/use-settings";

/**
 * Official APC party mark with the ballot thumbprint, shown alongside the
 * candidate's name. "light" sits on paper/card surfaces, "dark" on deep green.
 */
export function ApcBadge({
  label = "APC Candidate, Oyo Central",
  size = "md",
  variant = "light",
  className = "",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
}) {
  const images = useSiteImages();
  const h = size === "lg" ? 52 : size === "md" ? 38 : 26;
  const text = size === "lg" ? "text-[15px]" : size === "md" ? "text-[13px]" : "text-[11.5px]";
  const skin =
    variant === "dark"
      ? "border-on-dark-line bg-on-dark-line/30 text-on-dark"
      : "border-border bg-card text-primary-deep";

  return (
    <span
      className={`inline-flex items-center gap-3 rounded-sm border px-3 py-2 transition-transform duration-300 hover:-translate-y-0.5 ${skin} ${className}`}
    >
      <img
        src={images.apcBadge}
        alt="All Progressives Congress (APC) logo with ballot thumbprint"
        height={h}
        loading="lazy"
        style={{ height: h }}
        className="w-auto shrink-0 object-contain"
      />
      <span className={`font-bold ${text} leading-tight`}>{label}</span>
    </span>
  );
}
