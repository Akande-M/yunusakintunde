import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NEWS_FILTERS } from "@/lib/site-data";
import { getNewsList } from "@/lib/cms";
import { Chip, NewsCard, PageHeader } from "@/components/site/ui";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News & Updates | Senator Yunus Abiodun Akintunde, PhD, Oyo Central" },
      {
        name: "description",
        content:
          "Senate business, constituency work and 2027 campaign-trail activity from the office of Senator Yunus Abiodun Akintunde, PhD.",
      },
      { property: "og:title", content: "News & Updates | Akintunde 2027" },
      {
        property: "og:description",
        content: "Senate floor, constituency and campaign updates from Oyo Central.",
      },
    ],
  }),
  loader: () => getNewsList(),
  component: News,
});

function News() {
  const news = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof NEWS_FILTERS)[number]>("All");
  const items = news.filter((n) => filter === "All" || n.category === filter);

  return (
    <>
      <PageHeader
        eyebrow="News & campaign trail"
        title="News & Updates"
        lede="Senate business, constituency work, and campaign-trail activity as 2027 approaches, all in one place."
      />
      <section className="py-12 sm:py-14">
        <div className="wrap">
          <div className="mb-7 flex flex-wrap gap-2.5">
            {NEWS_FILTERS.map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {f}
              </Chip>
            ))}
          </div>
          <div className="hairline-grid grid sm:grid-cols-2 lg:grid-cols-3">
            {items.map((n) => (
              <NewsCard key={n.title} {...n} />
            ))}
          </div>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">No updates in this category yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
