import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site-data";
import { useMenu, useSiteImages } from "@/lib/use-settings";
import type { MenuNode } from "@/lib/pages";
import { btn } from "./ui";

/* The menu comes from Admin → Menu. Items with sub-links open on hover (desktop),
   on click or keyboard focus, and as an accordion on mobile. */

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);

function matches(node: MenuNode, path: string): boolean {
  if (node.href) {
    if (node.href === "/" ? path === "/" : path === node.href || path.startsWith(`${node.href}/`))
      return true;
  }
  return node.children.some((c) => matches(c, path));
}

function MenuLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  if (isExternal(href))
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer" onClick={onClick}>
        {children}
      </a>
    );
  return (
    <Link to={href as "/"} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden="true"
    className={`size-3.5 shrink-0 fill-current ${className}`}
  >
    <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
  </svg>
);

const itemCls =
  "flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:bg-secondary focus-visible:text-primary focus-visible:outline-none";

/** One entry inside a dropdown; a third level opens as a flyout to the side. */
function DropdownItem({ node, path, close }: { node: MenuNode; path: string; close: () => void }) {
  const active = matches(node, path);
  const tone = active ? " text-primary" : "";
  if (!node.children.length)
    return (
      <li>
        <MenuLink href={node.href ?? "/"} className={itemCls + tone} onClick={close}>
          {node.label}
        </MenuLink>
      </li>
    );
  return (
    <li className="group/sub relative">
      {node.href ? (
        <MenuLink href={node.href} className={itemCls + tone} onClick={close}>
          <span>{node.label}</span>
          <Chevron className="-rotate-90" />
        </MenuLink>
      ) : (
        <button type="button" aria-haspopup="true" className={itemCls + tone}>
          <span>{node.label}</span>
          <Chevron className="-rotate-90" />
        </button>
      )}
      <div className="invisible absolute top-0 left-full z-10 pl-1 opacity-0 transition-opacity duration-150 group-hover/sub:visible group-hover/sub:opacity-100 group-focus-within/sub:visible group-focus-within/sub:opacity-100">
        <ul className="w-64 rounded-md border border-border bg-card p-1.5 shadow-xl">
          {node.children.map((c) => (
            <DropdownItem key={c.label} node={c} path={path} close={close} />
          ))}
        </ul>
      </div>
    </li>
  );
}

function DesktopNav({ menu, path }: { menu: MenuNode[]; path: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const show = (i: number) => {
    clear();
    setOpenIdx(i);
  };
  const hide = () => {
    clear();
    timer.current = setTimeout(() => setOpenIdx(null), 160);
  };
  useEffect(() => clear, []);
  useEffect(() => setOpenIdx(null), [path]);

  const topCls = (active: boolean) =>
    `flex items-center gap-1 border-b-2 py-2 text-sm font-semibold whitespace-nowrap transition-colors hover:text-primary ${
      active ? "border-accent text-primary" : "border-transparent"
    }`;

  return (
    <nav aria-label="Main" className="hidden items-center gap-5 xl:flex 2xl:gap-7">
      {menu.map((n, i) => {
        const active = matches(n, path);
        if (!n.children.length)
          return (
            <MenuLink key={n.label} href={n.href ?? "/"} className={topCls(active)}>
              {n.label}
            </MenuLink>
          );
        const isOpen = openIdx === i;
        return (
          <div
            key={n.label}
            className="relative"
            onMouseEnter={() => show(i)}
            onMouseLeave={hide}
            onFocus={() => show(i)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpenIdx(null);
                (e.currentTarget.querySelector("[data-top]") as HTMLElement | null)?.focus();
              }
            }}
          >
            <button
              type="button"
              data-top
              aria-expanded={isOpen}
              aria-haspopup="true"
              onClick={() => (isOpen ? setOpenIdx(null) : show(i))}
              className={`${topCls(active)} cursor-pointer`}
            >
              {n.label}
              <Chevron
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`absolute top-full left-1/2 z-50 -translate-x-1/2 pt-2 transition-all duration-150 ${
                isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
              }`}
            >
              <ul className="w-64 rounded-md border border-border bg-card p-1.5 shadow-xl">
                {n.href && (
                  <li>
                    <MenuLink href={n.href} className={itemCls} onClick={() => setOpenIdx(null)}>
                      {n.label} overview
                    </MenuLink>
                  </li>
                )}
                {n.children.map((c) => (
                  <DropdownItem key={c.label} node={c} path={path} close={() => setOpenIdx(null)} />
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/** Mobile: nested accordion. */
function MobileItems({ nodes, path, depth }: { nodes: MenuNode[]; path: string; depth: number }) {
  const [expanded, setExpanded] = useState<string | null>(
    () => nodes.find((n) => n.children.length && matches(n, path))?.label ?? null,
  );
  const pad = depth === 0 ? "" : "pl-4";
  const size = depth === 0 ? "text-[15px] py-3.5" : "text-sm py-3";
  return (
    <ul className={depth === 0 ? "" : "border-l-2 border-accent/60 ml-1"}>
      {nodes.map((n) => {
        const active = matches(n, path);
        const tone = active ? "text-primary" : "";
        if (!n.children.length)
          return (
            <li key={n.label} className="border-b border-border last:border-0">
              <MenuLink
                href={n.href ?? "/"}
                className={`block font-semibold ${size} ${pad} ${tone}`}
              >
                {n.label}
              </MenuLink>
            </li>
          );
        const isOpen = expanded === n.label;
        return (
          <li key={n.label} className="border-b border-border last:border-0">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setExpanded(isOpen ? null : n.label)}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 text-left font-semibold ${size} ${pad} ${tone}`}
            >
              {n.label}
              <Chevron className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="pb-2">
                {n.href && (
                  <MenuLink href={n.href} className="block py-3 pl-4 text-sm font-semibold">
                    {n.label} overview
                  </MenuLink>
                )}
                <MobileItems nodes={n.children} path={path} depth={depth + 1} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Header() {
  const images = useSiteImages();
  const menu = useMenu();
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

        <div className="flex items-center gap-2 xl:gap-6">
          <DesktopNav menu={menu} path={pathname} />
          <span className="hidden sm:block">
            <Link to="/get-involved" className={btn.gold}>
              Get in touch
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-11 cursor-pointer items-center justify-center rounded-sm border border-border text-primary xl:hidden"
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
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="animate-fade-in max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-border bg-card xl:hidden"
        >
          <div className="wrap flex flex-col py-2">
            <MobileItems nodes={menu} path={pathname} depth={0} />
            <Link to="/get-involved" className={`${btn.gold} my-3 sm:hidden`}>
              Get in touch
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
