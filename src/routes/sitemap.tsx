import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/ui";

export const Route = createFileRoute("/sitemap")({
  head: () => ({
    meta: [
      { title: "Sitemap | Senator Yunus Abiodun Akintunde, PhD, Oyo Central" },
      {
        name: "description",
        content:
          "Every page on the Akintunde 2027 website: record and agenda, biography, news, media and get involved.",
      },
      { property: "og:title", content: "Sitemap | Akintunde 2027" },
      { property: "og:description", content: "All pages on the Akintunde 2027 website." },
    ],
  }),
  component: Sitemap,
});

const PAGES = [
  { to: "/", label: "Home", d: "The four-year record, at a glance." },
  {
    to: "/record-agenda",
    label: "Record & Agenda",
    d: "Promises kept 2023–2027, the 2027 agenda, and the evidence base.",
  },
  { to: "/biography", label: "Biography", d: "Education, business and public-service timeline." },
  { to: "/news", label: "News", d: "Senate floor, constituency and campaign-trail updates." },
  { to: "/media", label: "Media", d: "Photos and video from office and the campaign trail." },
  { to: "/get-involved", label: "Get Involved", d: "Volunteer, sign up, or contact the office." },
  { to: "/privacy", label: "Privacy Policy", d: "How supporter data is handled." },
] as const;

function Sitemap() {
  return (
    <>
      <PageHeader
        eyebrow="Site index"
        title="Sitemap"
        lede="Everything published on this website, in one list."
      />
      <section className="py-14">
        <div className="wrap max-w-[70ch]">
          <ul className="border-t border-border">
            {PAGES.map((p) => (
              <li key={p.to} className="border-b border-border py-5">
                <Link
                  to={p.to}
                  className="font-sans text-[16px] font-bold text-primary underline-offset-4 hover:underline"
                >
                  {p.label}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
