import { Fingerprint } from "lucide-react";
import apc from "@/assets/apc-logo.png.asset.json";

/**
 * APC party mark + thumbprint (ballot) icon.
 * variant "light" sits on paper/card surfaces, "dark" on the deep green surfaces.
 */
export function ApcBadge({
  label = "APC Candidate — Oyo Central",
  size = "md",
  variant = "light",
  className = "",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
}) {
  const dim = size === "lg" ? 44 : size === "md" ? 32 : 24;
  const text =
    size === "lg" ? "text-[15px]" : size === "md" ? "text-[13px]" : "text-[11.5px]";
  const skin =
    variant === "dark"
      ? "border-on-dark-line bg-on-dark-line/30 text-on-dark"
      : "border-border bg-card text-primary-deep";

  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-sm border px-3 py-1.5 transition-transform duration-300 hover:-translate-y-0.5 ${skin} ${className}`}
    >
      <img
        src={apc.url}
        alt="All Progressives Congress (APC) logo"
        width={dim}
        height={dim}
        loading="lazy"
        style={{ width: dim, height: dim }}
        className="shrink-0 object-contain"
      />
      <Fingerprint
        aria-hidden
        size={dim * 0.62}
        strokeWidth={1.6}
        className="shrink-0 text-accent-deep"
      />
      <span className={`font-bold ${text} leading-tight`}>{label}</span>
    </span>
  );
}
