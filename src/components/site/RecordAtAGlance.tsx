import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { GlanceTile } from "@/lib/cms-defaults";
import { Reveal } from "./Reveal";

/** Splits "/infrastructure-projects#tab-education" into a router path and hash. */
function target(href: string) {
  const [path = "/", hash] = href.split("#");
  return { path, hash };
}

/**
 * The record at a glance: one tile per area of work, each with its headline figure and a link
 * to the detailed section. Edited under Header, footer & home → Homepage → "Record at a glance".
 */
export function RecordAtAGlance({ tiles, projects }: { tiles: GlanceTile[]; projects: number }) {
  if (!tiles.length) return null;
  return (
    <section
      className="border-t border-border bg-paper-2 py-14 sm:py-16"
      aria-labelledby="glance-title"
    >
      <div className="wrap">
        <h2
          id="glance-title"
          className="mb-6 font-serif text-[26px] font-semibold text-primary-deep sm:text-[30px]"
        >
          The record at a glance
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t, i) => {
            const { path, hash } = target(t.href || "/achievements");
            const n = t.n.replace("{projects}", projects ? String(projects) : "");
            return (
              <Reveal as="li" key={t.l} delay={Math.min(i, 6) * 50}>
                <Link
                  to={path}
                  {...(hash ? { hash } : {})}
                  className="group flex h-full flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary sm:p-5"
                >
                  <span className="text-[11.5px] font-extrabold tracking-[0.06em] text-accent-deep uppercase">
                    {t.l}
                  </span>
                  <span className="mt-2 font-serif text-[24px] leading-tight font-semibold text-primary-deep sm:text-[28px]">
                    {n}
                  </span>
                  {t.note && (
                    <span className="mt-1 text-[13px] leading-snug text-muted-foreground">
                      {t.note}
                    </span>
                  )}
                  <ArrowUpRight
                    aria-hidden
                    className="mt-auto ml-auto size-4 pt-0 text-muted-foreground transition-colors group-hover:text-primary"
                  />
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
