import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getAchievements, getRecord } from "@/lib/cms";
import { getComingSoon, getPage } from "@/lib/pages";
import { needsAchievements, needsProjects, PageView } from "@/components/site/PageView";
import { btn, Eyebrow } from "@/components/site/ui";

/* Pages built in Admin → Pages (e.g. /outreach, /bills-and-motions). A published page shows
   its content. A menu link whose page isn't published yet shows "coming soon" (never the draft). */
export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const page = await getPage(params.slug);
    if (!page) {
      const label = await getComingSoon(params.slug);
      if (!label) throw notFound();
      return { kind: "soon" as const, label };
    }
    const [record, cards] = await Promise.all([
      needsProjects(page) ? getRecord() : null,
      needsAchievements(page) ? getAchievements() : null,
    ]);
    return {
      kind: "page" as const,
      page,
      data: { projects: record?.projects ?? [], cards: cards ?? [] },
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    if (loaderData.kind === "soon")
      return {
        meta: [
          { title: `${loaderData.label} | Senator Yunus Abiodun Akintunde, PhD` },
          { name: "robots", content: "noindex" },
        ],
      };
    const p = loaderData.page;
    const description = p.seoDescription || p.intro.slice(0, 160);
    return {
      meta: [
        { title: `${p.title} | Senator Yunus Abiodun Akintunde, PhD` },
        { name: "description", content: description },
        { property: "og:title", content: `${p.title} | Senator Akintunde` },
        { property: "og:description", content: description },
        ...(p.heroImage ? [{ property: "og:image", content: p.heroImage }] : []),
      ],
    };
  },
  component: CmsPage,
});

function CmsPage() {
  const d = Route.useLoaderData();
  if (d.kind === "page") return <PageView page={d.page} data={d.data} />;
  return (
    <section className="border-b border-border bg-paper-2 py-20 sm:py-28">
      <div className="wrap rise-in max-w-[62ch] text-center">
        <Eyebrow>Coming soon</Eyebrow>
        <h1 className="font-serif text-[34px] leading-[1.1] font-semibold text-primary-deep sm:text-[44px]">
          {d.label}
        </h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-[17px] text-muted-foreground">
          We're putting this page together. In the meantime, see what Senator Akintunde has already
          delivered for Oyo Central.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/achievements" className={btn.primary}>
            See the achievements
          </Link>
          <Link to="/news" className={btn.outline}>
            Latest news
          </Link>
        </div>
      </div>
    </section>
  );
}
