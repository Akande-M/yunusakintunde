import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site-data";
import { useSiteImages } from "@/lib/use-settings";
import { btn } from "./ui";
import { ApcBadge } from "./ApcBadge";

export function Header() {
  const images = useSiteImages();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="wrap grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
        <Link to="/" className="group flex min-w-0 items-center gap-3">
          <span className="size-11 shrink-0 overflow-hidden rounded-full border-2 border-accent transition-transform duration-300 group-hover:scale-105">
            <img
              src={images.portraitMain}
              alt=""
              className="size-full object-cover object-[center_18%]"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-serif text-[17px] leading-tight font-semibold text-primary-deep">
              {SITE.shortName}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">{SITE.role}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 lg:gap-6">
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "text-primary border-accent" }}
                inactiveProps={{ className: "border-transparent" }}
                className="border-b-2 py-2 text-sm font-semibold whitespace-nowrap transition-colors hover:text-primary"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <span className="hidden lg:block">
            <ApcBadge label="APC Candidate" size="sm" />
          </span>
          <span className="hidden sm:block">
            <Link to="/get-involved" className={btn.gold}>
              Get Involved
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-11 cursor-pointer items-center justify-center rounded-sm border border-border text-primary lg:hidden"
          >
            <span className="relative block h-3 w-5">
              <span
                className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute top-1.5 left-0 h-0.5 w-5 bg-current transition-opacity ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="animate-fade-in border-t border-border bg-card lg:hidden">
          <div className="wrap flex flex-col py-2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "text-primary" }}
                className="border-b border-border py-3.5 text-[15px] font-semibold last:border-0"
              >
                {n.label}
              </Link>
            ))}
            <ApcBadge size="sm" className="mt-3 self-start" />
            <Link to="/get-involved" className={`${btn.gold} my-3 sm:hidden`}>
              Get Involved
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
