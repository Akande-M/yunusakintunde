import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getNewsList } from "@/lib/cms";
import { getPressLinks, topicOf } from "@/lib/press";
import { Radio } from "lucide-react";
import { PressCoverage } from "@/components/site/PressCoverage";
import { useSiteSettings } from "@/lib/use-settings";
import { btn, Chip, NewsCard, PageHeader, SectionHead } from "@/components/site/ui";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News and Media | Senator Dr Yunus Abiodun Akintunde, Oyo Central" },
      {
        name: "description",
        content:
          "News about Senator Akintunde’s legislative activities, constituency projects, official engagements, political assignments, community visits and development interventions.",
      },
      { property: "og:title", content: "News & Updates | Akintunde 2027" },
      {
        property: "og:description",
        content: "Senate floor, constituency and campaign updates from Oyo Central.",
      },
    ],
  }),
  loader: async () => {
    const [news, press] = await Promise.all([getNewsList(), getPressLinks()]);
    return { news, press };
  },
  component: News,
});

function News() {
  const { page_headers, news_page: np } = useSiteSettings();
  const heading = page_headers.news;
  const { news, press } = Route.useLoaderData();
  const [topic, setTopic] = useState("All");
  const postTopic = (n: { title: string; summary?: string }) =>
    topicOf({ title: `${n.title} ${n.summary ?? ""}` });
  const posts = news.filter((n) => topic === "All" || postTopic(n) === topic);
  const stories = press.filter((p) => topic === "All" || topicOf(p) === topic);
  const releases = [
    ...news
      .filter((n) => postTopic(n) === "Press Releases and Official Statements")
      .map((n) => ({
        key: n.title,
        title: n.title,
        href: n.slug ? `/news/${n.slug}` : "",
        source: "Office of Senator Akintunde",
        date: n.date,
      })),
    ...press
      .filter((p) => topicOf(p) === "Press Releases and Official Statements")
      .map((p) => ({ key: p.url, title: p.title, href: p.url, source: p.source, date: p.date })),
  ];
  const counts = (t: string) =>
    news.filter((n) => postTopic(n) === t).length + press.filter((p) => topicOf(p) === t).length;

  return (
    <>
      <PageHeader {...heading} />
      <section className="py-10 sm:py-12">
        <div className="wrap">
          <h2 className="mb-3 text-[11.5px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
            News categories
          </h2>
          <div className="flex flex-wrap gap-2.5">
            <Chip active={topic === "All"} onClick={() => setTopic("All")}>
              All
            </Chip>
            {np.topics.map((t) => (
              <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
                {t}
                <span className="ml-1.5 text-[12px] opacity-70">{counts(t)}</span>
              </Chip>
            ))}
          </div>
          {posts.length > 0 && (
            <div className="hairline-grid mt-8 grid sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((n) => (
                <NewsCard key={n.title} {...n} />
              ))}
            </div>
          )}
          {posts.length === 0 && stories.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">No updates in this category yet.</p>
          )}
        </div>
      </section>

      <PressCoverage key={topic} items={stories} />

      <section id="press-releases" className="scroll-mt-24 border-t border-border py-12 sm:py-14">
        <div className="wrap max-w-[900px]">
          <SectionHead eyebrow="From the office" title={np.pressReleasesHeading} />
          <p className="-mt-3 max-w-[70ch] text-muted-foreground">{np.pressReleasesIntro}</p>
          {releases.length ? (
            <ul className="mt-6 divide-y divide-border rounded-lg border border-border bg-card">
              {releases.map((r) => (
                <li key={r.key} className="px-5 py-4">
                  {r.href ? (
                    <a
                      href={r.href}
                      target={r.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="font-bold text-foreground hover:text-primary"
                    >
                      {r.title}
                    </a>
                  ) : (
                    <span className="font-bold">{r.title}</span>
                  )}
                  <div className="mt-0.5 text-[13px] text-muted-foreground">
                    {[r.source, r.date].filter(Boolean).join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-lg border border-dashed border-border bg-card px-5 py-5 text-muted-foreground">
              Official statements from the office will be published here.
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-paper-2 py-12 sm:py-14">
        <div className="wrap">
          <SectionHead eyebrow="Gallery" title={np.galleryHeading} />
          <p className="-mt-3 max-w-[70ch] text-muted-foreground">{np.galleryIntro}</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {(
              [
                ["Photographs", np.photoTopics, "", "Open the photo gallery"],
                ["Videos", np.videoTopics, "Videos", "Watch the videos"],
              ] as const
            ).map(([title, list, tab, cta]) => (
              <div
                key={title}
                className="flex flex-col rounded-lg border border-border bg-card p-6"
              >
                <h3 className="font-serif text-[22px] font-semibold text-primary-deep">{title}</h3>
                <ul className="mt-3 space-y-2">
                  {list.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[14.5px]">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/media"
                  search={tab ? { tab } : {}}
                  className={`${btn.outline} mt-auto self-start`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="radio" className="scroll-mt-24 border-t border-border py-12 sm:py-14">
        <div className="wrap grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHead eyebrow="Media engagements" title={np.radioHeading} />
            <p className="-mt-3 text-[16px] text-muted-foreground">{np.radioIntro}</p>
            {np.radioOutro && (
              <p className="mt-4 text-[16px] text-muted-foreground">{np.radioOutro}</p>
            )}
          </div>
          <ul className="grid content-start gap-4">
            {np.stations.map((st) => (
              <li key={st.name} className="flex gap-4 rounded-lg border border-border bg-card p-5">
                <Radio aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
                <div>
                  <div className="text-[17px] font-bold">IGBALAYE on {st.name}</div>
                  <p className="mt-1 text-[14.5px] text-muted-foreground">{st.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
