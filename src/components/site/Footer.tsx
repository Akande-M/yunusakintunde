import { Link } from "@tanstack/react-router";
import { SITE, img } from "@/lib/site-data";
import { useSiteSettings } from "@/lib/use-settings";
import senateSeal from "@/assets/senate-seal.png.asset.json";
import oyoArms from "@/assets/oyo-arms.png.asset.json";
import apcOnly from "@/assets/apc-only.png.asset.json";
import thumbprint from "@/assets/thumbprint.png.asset.json";

const emblems = [
  { src: senateSeal.url, alt: "Seal of the Nigerian Senate" },
  { src: oyoArms.url, alt: "Coat of arms of Oyo State" },
  { src: apcOnly.url, alt: "All Progressives Congress (APC) logo" },
  { src: thumbprint.url, alt: "Ballot thumbprint" },
];

const explore = [
  { to: "/record-agenda", label: "Record & Agenda" },
  { to: "/biography", label: "Biography" },
  { to: "/news", label: "News" },
  { to: "/media", label: "Media" },
] as const;

export function Footer() {
  const { socials: s } = useSiteSettings();
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
      <div className="wrap mb-10 border-b border-on-dark-line pb-9">
        <p className="mb-5 text-center text-[12.5px] font-semibold tracking-wide text-on-dark-muted">
          Senator Yunus Abiodun Akintunde, PhD · Nigerian Senate · Oyo State · APC
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

      <div className="wrap grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3.5 flex items-center gap-3">
            <span className="size-11 shrink-0 overflow-hidden rounded-full border-2 border-accent">
              <img
                src={img.portraitWhite}
                alt=""
                className="size-full object-cover object-[center_18%]"
              />
            </span>
            <span>
              <span className="block font-serif text-[17px] font-semibold text-primary-foreground">
                {SITE.name}
              </span>
              <span className="block text-xs">{SITE.role}</span>
            </span>
          </div>
          <p className="max-w-[34ch] text-[13.5px]">
            Official website of Senator Yunus Abiodun Akintunde, PhD — seeking re-election for Oyo
            Central Senatorial District in 2027.
          </p>
        </div>

        <nav aria-label="Explore">
          <h2 className="mb-3.5 font-sans text-[13px] font-bold text-primary-foreground">
            Explore
          </h2>
          {explore.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="mb-2.5 block text-sm hover:text-primary-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Get involved">
          <h2 className="mb-3.5 font-sans text-[13px] font-bold text-primary-foreground">
            Get involved
          </h2>
          {["Volunteer", "Newsletter", "Support the campaign", "Report an issue"].map((l) => (
            <Link
              key={l}
              to="/get-involved"
              className="mb-2.5 block text-sm hover:text-primary-foreground"
            >
              {l}
            </Link>
          ))}
        </nav>

        {socials.length > 0 && (
          <nav aria-label="Follow">
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

      <div className="wrap mt-10 flex flex-wrap justify-between gap-2.5 border-t border-on-dark-line pt-5 text-[12.5px] text-on-dark-dim">
        <span>
          © {year} Senator Yunus Abiodun Akintunde, PhD · Oyo Central Senatorial District — All
          Rights Reserved
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
