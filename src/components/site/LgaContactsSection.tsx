import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { ZONES, zoneOf } from "@/lib/lgas";
import { formatPhone, telHref, type LgaContact, type LgaContacts } from "@/lib/lga-contacts";
import { SectionHead } from "./ui";

const RANK: Record<string, number> = { CRC: 0, LO: 1, SA: 2 };
const rank = (c: LgaContact) => RANK[c.role.toUpperCase().replace(/\W/g, "")] ?? 3;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** "Contact Us": the Senator's people in each local government, one tab per local government. */
export function LgaContactsSection({ data }: { data: LgaContacts }) {
  const inLga = (l: string) =>
    data.people
      .filter((p) => p.lgas.includes(l))
      .map((p, i) => ({ p, i }))
      .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
      .map((o) => o.p);
  const first = ZONES.flatMap((z) => [...z.lgas]).find((l) => inLga(l).length) ?? "Akinyele";
  const [sel, setSel] = useState<string>(first);

  // Open the tab named in the address, e.g. /get-involved#contact-oyo-east
  useEffect(() => {
    const m = /^#contact-(.+)$/.exec(window.location.hash);
    const hit = m && ZONES.flatMap((z) => [...z.lgas]).find((l) => slug(l) === m[1]);
    if (hit) {
      setSel(hit);
      setTimeout(
        () => document.getElementById("contact-us")?.scrollIntoView({ block: "start" }),
        350,
      );
    }
  }, []);

  if (!data.people.length) return null;
  const people = inLga(sel);

  return (
    <section
      id="contact-us"
      className="scroll-mt-24 border-b border-border bg-paper-2 py-12 sm:py-14"
    >
      <div className="wrap">
        <SectionHead eyebrow="Your local government" title={data.heading || "Contact Us"} />
        {data.intro && (
          <p className="-mt-3 mb-6 max-w-[70ch] text-[16px] text-muted-foreground">{data.intro}</p>
        )}

        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:p-5 lg:grid-cols-[1.25fr_1fr_.6fr]">
          {ZONES.map((z) => (
            <div key={z.zone} role="tablist" aria-label={`${z.zone} zone`}>
              <div className="mb-2 text-[11.5px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
                {z.zone} zone
              </div>
              <div className="flex flex-wrap gap-2">
                {z.lgas.map((l) => {
                  const n = inLga(l).length;
                  const on = sel === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-controls="contact-panel"
                      onClick={() => {
                        setSel(l);
                        history.replaceState(null, "", `#contact-${slug(l)}`);
                      }}
                      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : n
                            ? "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                            : "border-dashed border-border bg-card text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          id="contact-panel"
          role="tabpanel"
          aria-label={`${sel} Local Government`}
          className="mt-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-accent pb-3">
            <h3 className="font-serif text-[24px] font-semibold sm:text-[28px]">
              {sel} Local Government
            </h3>
            <span className="text-[12px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
              {zoneOf(sel)} zone
            </span>
          </div>

          {people.length === 0 ? (
            <p className="mt-6 text-muted-foreground">
              Contacts for {sel} are coming soon. Meanwhile, reach the constituency office using the
              details below.
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((c) => (
                <li
                  key={`${c.name}-${c.phone}`}
                  className="flex flex-col rounded-lg border border-border bg-card p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[16px] leading-snug font-bold">{c.name}</div>
                      {c.note && (
                        <div className="mt-0.5 text-[12.5px] text-muted-foreground">{c.note}</div>
                      )}
                    </div>
                    {c.role && (
                      <span className="shrink-0 rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-extrabold tracking-[0.06em] text-primary uppercase">
                        {c.role}
                      </span>
                    )}
                  </div>
                  {c.phone && (
                    <a
                      href={telHref(c.phone)}
                      className="mt-4 inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-primary px-4 text-[15px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      aria-label={`Call ${c.name} on ${formatPhone(c.phone)}`}
                    >
                      <Phone className="size-4" aria-hidden />
                      {formatPhone(c.phone)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
