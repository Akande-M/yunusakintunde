import { createFileRoute } from "@tanstack/react-router";
import { useSiteSettings } from "@/lib/use-settings";
import { PageHeader } from "@/components/site/ui";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Akintunde 2027 campaign, Oyo Central" },
      {
        name: "description",
        content:
          "How the Akintunde 2027 campaign collects, uses and protects supporter data, and how to unsubscribe or request deletion.",
      },
      { property: "og:title", content: "Privacy Policy | Akintunde 2027" },
      {
        property: "og:description",
        content: "How supporter data is collected, used, stored and deleted.",
      },
    ],
  }),
  component: Privacy,
});

const SECTIONS = [
  {
    h: "What we collect",
    p: "When you sign up through this website we collect your name, email address, phone number, LGA/ward, your selected interest, and any message you choose to send.",
  },
  {
    h: "How we use it",
    p: "Your details are used to send campaign updates and newsletters, to respond to constituency issues you report, and to coordinate volunteering or town hall requests. We do not sell or rent supporter data.",
  },
  {
    h: "Consent and unsubscribing",
    p: "We only contact you where you have ticked the consent box. Every email includes an unsubscribe link, and you can reply STOP to any SMS. You may also email the constituency office to be removed at any time.",
  },
  {
    h: "Storage and retention",
    p: "Supporter records are held securely by the campaign's email and CRM provider and retained until the end of the 2027 election cycle, or until you ask us to delete them, whichever comes first.",
  },
  {
    h: "Your rights",
    p: "Under the Nigeria Data Protection Act you may request a copy of the data we hold about you, ask for corrections, or ask us to delete it. We respond to requests within 30 days.",
  },
];

function Privacy() {
  const { contact: SITE } = useSiteSettings();
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        lede="Plain-language summary of how the Akintunde 2027 campaign handles the information you share with us."
      />
      <section className="py-14">
        <div className="wrap max-w-[70ch]">
          {SECTIONS.map((s) => (
            <div key={s.h} className="border-b border-border py-6 first:pt-0">
              <h2 className="text-[20px] font-semibold">{s.h}</h2>
              <p className="mt-2.5 text-[15.5px] text-muted-foreground">{s.p}</p>
            </div>
          ))}
          <p className="mt-7 text-sm text-muted-foreground">
            Questions about this policy? Write to{" "}
            <a className="font-bold text-primary" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>{" "}
            or visit the constituency office at {SITE.office}.
          </p>
        </div>
      </section>
    </>
  );
}
