import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Images, PenSquare, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { abtn, Card, PageTitle, Spinner } from "@/components/admin/kit";
import { useAdminAuth } from "@/components/admin/auth";
import { ImageCheck } from "@/components/admin/ImageCheck";
import { ContentUpdates } from "@/components/admin/ContentUpdates";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

type Stats = {
  published: number;
  drafts: number;
  signupsTotal: number;
  signupsWeek: number;
  signupsOpen: number;
  recent: { full_name: string; lga_ward: string; intent: string; created_at: string }[];
};

async function count(
  table: string,
  filter: (q: ReturnType<typeof base>) => ReturnType<typeof base>,
) {
  const { count } = await filter(base(table));
  return count ?? 0;
}
function base(table: string) {
  return db.from(table).select("id", { count: "exact", head: true });
}

function Dashboard() {
  const { fullName } = useAdminAuth();
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    void Promise.all([
      count("news_posts", (q) => q.eq("status", "published")),
      count("news_posts", (q) => q.eq("status", "draft")),
      count("signups", (q) => q),
      count("signups", (q) => q.gte("created_at", weekAgo)),
      count("signups", (q) => q.eq("handled", false)),
      db
        .from("signups")
        .select("full_name,lga_ward,intent,created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]).then(([published, drafts, signupsTotal, signupsWeek, signupsOpen, recent]) =>
      setS({
        published,
        drafts,
        signupsTotal,
        signupsWeek,
        signupsOpen,
        recent: (recent.data as Stats["recent"]) ?? [],
      }),
    );
  }, []);

  return (
    <>
      <PageTitle
        title={`Welcome${fullName ? `, ${fullName.split(" ")[0]}` : ""}`}
        sub="Everything you change here goes live on the website as soon as you save or publish."
        action={
          <>
            <Link to="/admin/news/$id" params={{ id: "new" }} className={abtn.primary}>
              <PenSquare className="size-4" /> Write news
            </Link>
            <Link to="/admin/media" className={abtn.outline}>
              <Images className="size-4" /> Add photos / video
            </Link>
          </>
        }
      />
      <ContentUpdates />
      {!s ? (
        <Spinner />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { n: s.signupsWeek, l: "Sign-ups this week", accent: true },
              { n: s.signupsOpen, l: "Sign-ups to follow up" },
              { n: s.published, l: "News stories live" },
              { n: s.drafts, l: "Drafts" },
            ].map((x) => (
              <Card key={x.l} className={x.accent ? "border-accent" : ""}>
                <div className="font-serif text-[30px] font-semibold text-primary-deep">{x.n}</div>
                <div className="text-[12.5px] text-muted-foreground">{x.l}</div>
              </Card>
            ))}
          </div>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">Latest sign-ups</h2>
              <Link to="/admin/signups" className="text-[13px] font-bold text-primary">
                See all {s.signupsTotal} →
              </Link>
            </div>
            {s.recent.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserPlus className="size-4" /> No sign-ups yet. They'll appear here as soon as
                someone fills in Get Involved.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {s.recent.map((r, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm"
                  >
                    <span>
                      <span className="font-bold">{r.full_name}</span>
                      <span className="text-muted-foreground"> · {r.lga_ward}</span>
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">
                      {r.intent} · {format(new Date(r.created_at), "d MMM, HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <ImageCheck />
        </>
      )}
    </>
  );
}
