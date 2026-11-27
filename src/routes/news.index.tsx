import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getNewsList } from "@/lib/cms";
import {
  categoryOf,
  getPressLinks,
  NEWS_CATEGORIES,
  postCategory,
  type NewsCategory,
} from "@/lib/press";
import { PressCoverage } from "@/components/site/PressCoverage";
import { useSiteSettings } from "@/lib/use-settings";
import { Chip, NewsCard, PageHeader } from "@/components/site/ui";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News & Updates | Senator Dr Yunus Abiodun Akintunde, Oyo Central" },
      {
        name: "description",
        content:
          "Senate business, constituency work and 2027 campaign-trail activity from the office of Senator Dr Yunus Abiodun Akintunde.",
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
  const heading = useSiteSettings().page_headers.news;
  const { news, press } = Route.useLoaderData();
  const [filter, setFilter] = useState<NewsCategory | "All">("All");
  // /news#press-releases (from the menu) opens that category.
  const routerHash = useRouterState({ select: (st) => st.location.hash });
  useEffect(() => {
    const h = window.location.hash.replace(/^#/, "");
    const hit = NEWS_CATEGORIES.find((c) => c.toLowerCase().replace(/[^a-z0-9]+/g, "-") === h);
    if (hit) setFilter(hit);
  }, [routerHash]);
  const items = news.filter(
    (n) => filter === "All" || postCategory(n.category, n.title) === filter,
  );
  const stories = press.filter((p) => filter === "All" || categoryOf(p) === filter);
  const count = (c: NewsCategory) =>
    news.filter((n) => postCategory(n.category, n.title) === c).length +
    press.filter((p) => categoryOf(p) === c).length;

  return (
    <>
      <PageHeader {...heading} />
      <section className="py-12 sm:py-14">
        <div className="wrap">
          <div className="mb-7 flex flex-wrap gap-2.5">
            <Chip active={filter === "All"} onClick={() => setFilter("All")}>
              All
            </Chip>
            {NEWS_CATEGORIES.filter((c) => count(c) > 0).map((c) => (
              <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
                {c}
              </Chip>
            ))}
          </div>
          {items.length > 0 && (
            <div className="hairline-grid grid sm:grid-cols-2 lg:grid-cols-3">
              {items.map((n) => (
                <NewsCard key={n.title} {...n} />
              ))}
            </div>
          )}
          {items.length === 0 && stories.length === 0 && (
            <p className="text-sm text-muted-foreground">No updates in this category yet.</p>
          )}
        </div>
      </section>
      <PressCoverage key={filter} items={stories} />
    </>
  );
}
