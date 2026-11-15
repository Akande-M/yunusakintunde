import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SmartImage } from "@/components/site/ui";
import { Reveal } from "@/components/site/Reveal";
import { getArticle } from "@/lib/cms";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => {
    const article = await getArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.article.title} — Akintunde 2027` },
          {
            name: "description",
            content: loaderData.article.paragraphs[0]?.slice(0, 155) ?? "",
          },
          { property: "og:title", content: loaderData.article.title },
          { property: "og:image", content: loaderData.article.hero },
          {
            property: "og:description",
            content: loaderData.article.paragraphs[0]?.slice(0, 155) ?? "",
          },
        ]
      : [{ title: "Story not found — Akintunde 2027" }, { name: "robots", content: "noindex" }],
  }),
  component: NewsArticle,
  notFoundComponent: ArticleNotFound,
});

function NewsArticle() {
  const { article } = Route.useLoaderData();

  return (
    <>
      <section className="border-b border-border bg-panel py-10 sm:py-12">
        <div className="wrap max-w-3xl">
          <Link
            to="/news"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all news
          </Link>
          <Reveal>
            <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-accent-foreground">{article.category}</span>
              <span aria-hidden="true">·</span>
              <time>{article.date}</time>
            </p>
            <h1 className="font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {article.title}
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="wrap max-w-3xl">
          <Reveal>
            <SmartImage
              src={article.hero}
              alt={article.heroAlt}
              priority
              className="aspect-[16/10] w-full"
            />
          </Reveal>
          <Reveal as="article" className="prose-article mt-8 space-y-5">
            {article.paragraphs.map((p, i) => (
              <p key={i} className="leading-relaxed text-foreground/90">
                {p}
              </p>
            ))}
          </Reveal>

          {article.photos.length > 0 && (
            <Reveal className="mt-12">
              <h2 className="mb-5 font-heading text-xl font-semibold text-foreground">
                Photos from the event
              </h2>
              <div className="space-y-8">
                {article.photos.map((photo) => (
                  <figure key={photo.url}>
                    <SmartImage src={photo.url} alt={photo.alt} className="aspect-[16/10] w-full" />
                    <figcaption className="mt-2 text-sm text-muted-foreground">
                      {photo.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}

function ArticleNotFound() {
  return (
    <section className="py-24">
      <div className="wrap max-w-xl text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Story not found</h1>
        <p className="mt-3 text-muted-foreground">
          This update isn't available yet. Browse the latest news from the campaign instead.
        </p>
        <Link
          to="/news"
          className="mt-6 inline-flex items-center gap-2 font-medium text-primary hover:text-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to all news
        </Link>
      </div>
    </section>
  );
}
