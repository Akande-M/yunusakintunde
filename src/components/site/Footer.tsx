import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site-data";
import { LGAS, lgaSlug } from "@/lib/lgas";
import { useSiteSettings } from "@/lib/use-settings";

/** Quick links, in the order given in the office's master content. */
const QUICK_LINKS: { label: string; to: string; slug?: string }[] = [
  { label: "Home", to: "/" },
  { label: "Biography", to: "/biography" },
  { label: "Achievements", to: "/achievements" },
  { label: "Legislative Work", to: "/$slug", slug: "bills-and-motions" },
  {
    label: "Constituency Projects",
    to: "/$slug",
    slug: "constituency-interventions-and-development-projects",
  },
  {
    label: "Political Leadership",
    to: "/$slug",
    slug: "political-leadership-and-party-engagement",
  },
  { label: "News and Media", to: "/news" },
  { label: "Contact", to: "/get-involved" },
];

export function Footer() {
  const { socials: s, footer, images } = useSiteSettings();
  const emblems = [
    { src: images.senateSeal, alt: "Seal of the Nigerian Senate" },
    { src: images.oyoArms, alt: "Coat of arms of Oyo State" },
    { src: images.apcLogo, alt: "All Progressives Congress (APC) logo" },
    { src: images.thumbprint, alt: "Ballot thumbprint" },
  ];
  const socials = [
    { label: "Facebook", href: s.facebook },
    { label: "Instagram", href: s.instagram },
    { label: "X (Twitter)", href: s.x },
    { label: "YouTube", href: s.youtube },
    { label: "LinkedIn", href: s.linkedin },
  ].filter((l) => l.href);
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary-deep pt-10 pb-6 text-on-dark-muted">
      {footer.showEmblems && (
        <div className="wrap mb-10 border-b border-on-dark-line pb-9">
          <p className="mb-5 text-center text-[12.5px] font-semibold tracking-wide text-on-dark-muted">
            {footer.topLine}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
            {emblems.map((e) => (
              <li
                key={e.alt}
                className="grid size-16 place-items-center rounded-sm bg-primary-foreground/95 p-2 transition-transform duration-300 hover:-translate-y-0.5 sm:size-24 sm:p-2.5"
              >
                <img
                  src={e.src}
                  alt={e.alt}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="wrap grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_.9fr_1.2fr_.8fr]">
        <div>
          <div className="mb-3.5 flex items-center gap-3">
            <span className="size-11 shrink-0 overflow-hidden rounded-full border-2 border-accent">
              <img
                src={images.portraitMain}
                alt=""
                className="size-full object-cover object-[center_18%]"
              />
            </span>
            <span className="block font-serif text-[17px] leading-tight font-semibold text-primary-foreground">
              {SITE.name}
            </span>
          </div>
          <p className="text-[13.5px] leading-relaxed">
            Senator representing Oyo Central Senatorial District
            <br />
            Federal Republic of Nigeria
          </p>
          <p className="mt-4 max-w-[36ch] text-[13.5px] text-on-dark">{footer.blurb}</p>
        </div>

        <nav aria-label="Quick links">
          <h2 className="mb-3.5 font-sans text-[13px] font-bold text-primary-foreground">
            Quick links
          </h2>
          {QUICK_LINKS.map((l) =>
            l.slug ? (
              <Link
                key={l.label}
                to="/$slug"
                params={{ slug: l.slug }}
                className="mb-2.5 block text-sm hover:text-primary-foreground"
              >
                {l.label}
              </Link>
            ) : (
              <Link
                key={l.label}
                to={l.to}
                className="mb-2.5 block text-sm hover:text-primary-foreground"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <nav aria-label="Constituency">
          <h2 className="mb-3.5 font-sans text-[13px] font-bold text-primary-foreground">
            Constituency
          </h2>
          <ul className="grid grid-cols-2 gap-x-4">
            {[...LGAS].sort().map((l) => (
              <li key={l}>
                <Link
                  to="/$slug"
                  params={{ slug: "constituency-interventions-and-development-projects" }}
                  hash={`find-${lgaSlug(l)}`}
                  className="mb-2.5 block text-sm hover:text-primary-foreground"
                >
                  {l.replace(/^Ona Ara$/, "Ona-Ara").replace(/^Ogo Oluwa$/, "Ogo-Oluwa")}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <nav aria-label="Get involved">
            <h2 className="mb-3.5 font-sans text-[13px] font-bold text-primary-foreground">
              Get involved
            </h2>
            {[
              ["Volunteer", "/get-involved"],
              ["Contact your local office", "/get-involved"],
              ["Support the campaign", "/support"],
            ].map(([l, to]) => (
              <Link key={l} to={to!} className="mb-2.5 block text-sm hover:text-primary-foreground">
                {l}
              </Link>
            ))}
          </nav>
          {socials.length > 0 && (
            <nav aria-label="Follow" className="mt-6">
              <h2 className="mb-3.5 font-sans text-[13px] font-bold text-primary-foreground">
                Follow
              </h2>
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2.5 block text-sm hover:text-primary-foreground"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>

      <div className="wrap mt-10 flex flex-wrap justify-between gap-2.5 border-t border-on-dark-line pt-5 text-[12.5px] text-on-dark-dim">
        <span>
          {footer.copyright
            .replace(/\{+\s*year\s*\}+/gi, String(year))
            .replace(/\{+\s*(\d{4})\s*\}+/g, "$1")}
        </span>
        <span className="flex gap-3">
          <Link to="/privacy" className="hover:text-primary-foreground">
            Privacy Policy
          </Link>
          <Link to="/sitemap" className="hover:text-primary-foreground">
            Sitemap
          </Link>
        </span>
      </div>
    </footer>
  );
}
