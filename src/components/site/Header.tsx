import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Facebook, Instagram, Mail, Phone, Youtube } from "lucide-react";
import { useMenu, useSiteImages, useSiteSettings } from "@/lib/use-settings";
import { navIcon } from "@/lib/nav-icons";
import type { MenuNode } from "@/lib/pages";

/* Two-tier header: a slim contact/social bar, then the main bar with the menu.
   Wording, contact and button: Admin → Site content → Header. Links: Admin → Menu.
   Menu groups open a full-width panel on hover, click or keyboard focus; a link inside the
   panel that has its own sub-links opens them in a drop-down directly beneath it. */

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);
/** Placeholder phone numbers are never shown in the header. */
const looksFake = (v: string) => !v.trim() || /000 0000|\[[^\]]*\]/.test(v);

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
  children: ReactNode;
  onClick?: () => void;
}) {
  if (isExternal(href))
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer" onClick={onClick}>
        {children}
      </a>
    );
  // "/infrastructure-projects#tab-education" opens that page on that tab.
  const [to = "/", hash] = href.split("#");
  return (
    <Link to={to as "/"} {...(hash ? { hash } : {})} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

const XLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className}`}>
    <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z" />
  </svg>
);

// ------------------------------------------------------------------ top bar
function TopBar() {
  const { header, contact, socials } = useSiteSettings();
  if (!header.showTopBar) return null;
  const phone = header.showPhone && !looksFake(contact.phone) ? contact.phone.trim() : "";
  const email = header.showEmail && contact.email.trim() ? contact.email.trim() : "";
  const icons = [
    {
      key: "facebook",
      label: "Facebook",
      url: socials.facebook,
      icon: <Facebook className="size-4" />,
    },
    { key: "x", label: "X (Twitter)", url: socials.x, icon: <XLogo className="size-3.5" /> },
    {
      key: "youtube",
      label: "YouTube",
      url: socials.youtube,
      icon: <Youtube className="size-4" />,
    },
    {
      key: "instagram",
      label: "Instagram",
      url: socials.instagram,
      icon: <Instagram className="size-4" />,
    },
  ];
  const dot = <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-on-dark" />;
  const circle =
    "grid size-8 place-items-center rounded-full border-[1.5px] border-on-dark/85 text-on-dark transition-colors sm:size-9";

  return (
    <div className="bg-primary text-on-dark">
      <div className="wrap flex min-h-11 items-center justify-between gap-4 py-1.5 text-[13px] font-semibold">
        <ul className="flex min-w-0 items-center gap-6 lg:gap-10">
          {phone && (
            <li className="flex items-center gap-2.5">
              {dot}
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-1.5 hover:underline"
              >
                <Phone className="size-3.5 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">{phone}</span>
                <span className="sr-only sm:hidden">Call {phone}</span>
              </a>
            </li>
          )}
          {email && (
            <li className="flex min-w-0 items-center gap-2.5">
              {dot}
              <a
                href={`mailto:${email}`}
                className="flex min-w-0 items-center gap-1.5 hover:underline"
              >
                <Mail className="size-3.5 sm:hidden" aria-hidden />
                <span className="hidden truncate sm:inline">{email}</span>
                <span className="sr-only sm:hidden">Email {email}</span>
              </a>
            </li>
          )}
        </ul>
        {header.showSocials && (
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="hidden items-center gap-2.5 md:flex">
              {dot}
              {header.followLabel} :
            </span>
            <ul className="flex items-center gap-2">
              {icons.map((s) => (
                <li key={s.key}>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className={`${circle} hover:bg-on-dark hover:text-primary`}
                    >
                      {s.icon}
                    </a>
                  ) : (
                    // Link not added yet in Admin → Site content → Social links.
                    <span
                      aria-hidden
                      title={`${s.label} link coming soon`}
                      className={`${circle} opacity-70`}
                    >
                      {s.icon}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ desktop menu
/** Active item: bold text and a thick underline with curved top-left and bottom-right corners. */
function Underline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute inset-x-0 bottom-3.5 h-[5px] origin-left rounded-tl-[7px] rounded-br-[7px] bg-accent transition-transform duration-200 ${
        active ? "scale-x-100" : "scale-x-0 opacity-70 group-hover/top:scale-x-100"
      }`}
    />
  );
}

/** One link in the full-width panel; its own sub-links open in a drop-down beneath it. */
function PanelItem({ node, path, close }: { node: MenuNode; path: string; close: () => void }) {
  const Icon = navIcon(node.label, node.icon);
  const active = matches(node, path);
  const box = `group/item flex h-full w-full items-center gap-3.5 rounded-lg border px-4 py-3.5 text-left transition-colors ${
    active
      ? "border-accent bg-accent-tint/60"
      : "border-transparent hover:border-border hover:bg-paper-2 focus-visible:border-border focus-visible:bg-paper-2"
  } focus-visible:outline-none`;
  const body = (
    <>
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-lg transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "bg-primary-tint text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground"
        }`}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span
        className={`min-w-0 flex-1 text-[14.5px] leading-snug ${active ? "font-extrabold text-primary-deep" : "font-semibold text-foreground"}`}
      >
        {node.label}
      </span>
      {node.children.length > 0 && (
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/sub:rotate-180" />
      )}
    </>
  );

  if (!node.children.length)
    return (
      <li>
        <MenuLink href={node.href ?? "/"} className={box} onClick={close}>
          {body}
        </MenuLink>
      </li>
    );

  return (
    <li className="group/sub relative">
      {node.href ? (
        <MenuLink href={node.href} className={box} onClick={close}>
          {body}
        </MenuLink>
      ) : (
        <button type="button" aria-haspopup="true" className={`${box} cursor-pointer`}>
          {body}
        </button>
      )}
      <div className="invisible absolute inset-x-0 top-full z-10 pt-1.5 opacity-0 transition-all duration-150 group-focus-within/sub:visible group-focus-within/sub:opacity-100 group-hover/sub:visible group-hover/sub:opacity-100">
        <ul className="rounded-lg border border-border bg-card p-1.5 shadow-xl">
          {node.children.map((c) => {
            const SubIcon = navIcon(c.label, c.icon);
            const subActive = matches(c, path);
            return (
              <li key={c.label}>
                <MenuLink
                  href={c.href ?? "/"}
                  onClick={close}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors hover:bg-primary-tint hover:text-primary focus-visible:bg-primary-tint focus-visible:outline-none ${
                    subActive ? "font-extrabold text-primary" : "font-semibold"
                  }`}
                >
                  <SubIcon className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex-1">{c.label}</span>
                  <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
                </MenuLink>
              </li>
            );
          })}
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
    timer.current = setTimeout(() => setOpenIdx(null), 180);
  };
  useEffect(() => clear, []);
  useEffect(() => setOpenIdx(null), [path]);

  const top = (active: boolean) =>
    `group/top relative flex h-full items-center gap-1.5 px-0.5 text-[15px] whitespace-nowrap text-on-dark transition-colors hover:text-white ${
      active ? "font-extrabold" : "font-medium"
    }`;

  return (
    <nav aria-label="Main" className="hidden items-stretch gap-5 xl:flex 2xl:gap-8">
      {menu.map((n, i) => {
        const active = matches(n, path);
        if (!n.children.length)
          return (
            <MenuLink key={n.label} href={n.href ?? "/"} className={top(active)}>
              {n.label}
              <Underline active={active} />
            </MenuLink>
          );
        const isOpen = openIdx === i;
        const cols = Math.min(n.children.length + (n.href ? 1 : 0), 5);
        return (
          // Not positioned: the panel spans the whole header, not just this item.
          <div
            key={n.label}
            className="flex items-stretch"
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
              className={`${top(active)} cursor-pointer`}
            >
              {n.label}
              <ChevronDown
                className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
              <Underline active={active || isOpen} />
            </button>
            <div
              className={`absolute inset-x-0 top-full z-50 border-t-[3px] border-accent bg-card text-foreground shadow-[0_24px_40px_-18px_rgba(10,40,25,.45)] transition-all duration-200 ${
                isOpen
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-1.5 opacity-0"
              }`}
            >
              <div className="wrap py-6">
                <p className="mb-3 text-[11.5px] font-extrabold tracking-[0.12em] text-accent-deep uppercase">
                  {n.label}
                </p>
                <ul
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {n.href && (
                    <PanelItem
                      node={{
                        label: `${n.label} overview`,
                        href: n.href,
                        icon: n.icon ?? null,
                        children: [],
                      }}
                      path={path}
                      close={() => setOpenIdx(null)}
                    />
                  )}
                  {n.children.map((c) => (
                    <PanelItem key={c.label} node={c} path={path} close={() => setOpenIdx(null)} />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ------------------------------------------------------------------ mobile menu
function MobileItems({ nodes, path, depth }: { nodes: MenuNode[]; path: string; depth: number }) {
  const [expanded, setExpanded] = useState<string | null>(
    () => nodes.find((n) => n.children.length && matches(n, path))?.label ?? null,
  );
  const pad = depth === 0 ? "" : "pl-4";
  const size = depth === 0 ? "text-[15px] py-3.5" : "text-sm py-3";
  return (
    <ul className={depth === 0 ? "" : "ml-1 border-l-2 border-accent/60"}>
      {nodes.map((n) => {
        const active = matches(n, path);
        const tone = active ? "text-primary font-extrabold" : "font-semibold";
        const Icon = depth > 0 ? navIcon(n.label, n.icon) : null;
        const label = (
          <span className="flex items-center gap-2.5">
            {Icon && <Icon className="size-4 shrink-0 text-primary" aria-hidden />}
            {n.label}
          </span>
        );
        if (!n.children.length)
          return (
            <li key={n.label} className="border-b border-border last:border-0">
              <MenuLink href={n.href ?? "/"} className={`block ${size} ${pad} ${tone}`}>
                {label}
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
              className={`flex w-full cursor-pointer items-center justify-between gap-3 text-left ${size} ${pad} ${tone}`}
            >
              {label}
              <ChevronDown
                className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
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

// ------------------------------------------------------------------ header
const ctaCls =
  "btn-fx inline-flex min-h-11 shrink-0 items-center justify-center rounded-full! border-2 border-on-dark px-6 text-[15px] font-semibold whitespace-nowrap text-on-dark hover:bg-on-dark hover:text-primary-deep";

export function Header() {
  const images = useSiteImages();
  const { header } = useSiteSettings();
  const menu = useMenu();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <TopBar />
      <header className="sticky top-0 z-50 bg-primary-deep text-on-dark shadow-[0_6px_18px_-10px_rgba(0,0,0,.5)]">
        <div className="wrap flex min-h-[76px] items-stretch justify-between gap-5">
          <Link to="/" className="group flex min-w-0 items-center gap-3 py-3">
            <span className="size-11 shrink-0 overflow-hidden rounded-full border-2 border-accent transition-transform duration-300 group-hover:scale-105">
              <img
                src={images.portraitMain}
                alt=""
                className="size-full object-cover object-[center_18%]"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-[17px] leading-tight font-semibold text-on-dark">
                {header.siteName}
              </span>
              <span className="hidden text-xs text-on-dark-muted sm:block">
                {header.siteTagline}
              </span>
            </span>
          </Link>

          <DesktopNav menu={menu} path={pathname} />

          <div className="flex shrink-0 items-center gap-3">
            {header.ctaLabel && (
              <span className="hidden sm:block">
                <MenuLink href={header.ctaHref || "/get-involved"} className={ctaCls}>
                  {header.ctaLabel}
                </MenuLink>
              </span>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex size-11 cursor-pointer items-center justify-center rounded-md border border-on-dark-line text-on-dark xl:hidden"
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
            className="animate-fade-in max-h-[calc(100dvh-76px)] overflow-y-auto border-t-[3px] border-accent bg-card text-foreground xl:hidden"
          >
            <div className="wrap flex flex-col py-2">
              <MobileItems nodes={menu} path={pathname} depth={0} />
              {header.ctaLabel && (
                <MenuLink
                  href={header.ctaHref || "/get-involved"}
                  className="btn-fx my-3 inline-flex min-h-11 items-center justify-center rounded-full! bg-primary px-6 text-[15px] font-bold text-primary-foreground sm:hidden"
                >
                  {header.ctaLabel}
                </MenuLink>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
