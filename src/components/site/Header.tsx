import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NAV, SITE, img } from "@/lib/site-data";
import { btn } from "./ui";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="bg-primary-deep text-on-dark-muted">
        <div className="wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-2 text-[13px]">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-sm bg-accent px-2 py-0.5 text-[11.5px] font-extrabold tracking-wide text-accent-foreground">
              AKINTUNDE 2027
            </span>
            <span className="hidden sm:inline">{SITE.tagline}</span>
          </span>
          <div className="flex shrink-0 gap-5">
            <Link to="/get-involved" className="hover:text-on-dark">
              Get Involved
            </Link>
            <a href="#" className="hover:text-on-dark">
              Yorùbá
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="wrap grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="size-11 shrink-0 overflow-hidden rounded-full border-2 border-accent">
              <img
                src={img.portraitWhite}
                alt=""
                className="size-full object-cover object-[center_18%]"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-[17px] leading-tight font-semibold text-primary-deep">
                {SITE.name}
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
            <Link to="/get-involved" className={`${btn.gold} hidden sm:inline-flex`}>
              Get Involved
            </Link>
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
          <nav id="mobile-nav" className="border-t border-border bg-card lg:hidden">
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
              <Link to="/get-involved" className={`${btn.gold} my-3 sm:hidden`}>
                Get Involved
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
