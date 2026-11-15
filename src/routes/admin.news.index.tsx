import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/db";
import {
  abtn,
  Badge,
  ConfirmButton,
  errMsg,
  inputCls,
  PageTitle,
  Spinner,
} from "@/components/admin/kit";

export const Route = createFileRoute("/admin/news/")({
  component: NewsList,
});

type Row = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "draft" | "published";
  published_at: string;
  updated_at: string;
  body: string;
};

function NewsList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("news_posts")
      .select("id,slug,title,category,status,published_at,updated_at,body")
      .order("published_at", { ascending: false });
    if (error) toast.error(errMsg(error));
    setRows((data as Row[]) ?? []);
  }, []);
  useEffect(() => void load(), [load]);

  const shown = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          (status === "all" || r.status === status) &&
          r.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [rows, q, status],
  );

  async function remove(id: string) {
    const { error } = await db.from("news_posts").delete().eq("id", id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Story deleted");
    void load();
  }

  return (
    <>
      <PageTitle
        title="News"
        sub="Stories appear on the homepage (latest 3) and the News page. Drafts are only visible here."
        action={
          <Link to="/admin/news/$id" params={{ id: "new" }} className={abtn.primary}>
            <Plus className="size-4" /> New story
          </Link>
        }
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          className={inputCls}
          placeholder="Search by title…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={`${inputCls} sm:w-48`}
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="all">All stories</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>
      {!rows ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No stories match.</p>
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border bg-card">
          {shown.map((r) => {
            const scheduled = r.status === "published" && new Date(r.published_at) > new Date();
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to="/admin/news/$id"
                    params={{ id: r.id }}
                    className="block truncate text-[14.5px] font-bold hover:text-primary"
                  >
                    {r.title}
                  </Link>
                  <div className="text-[12.5px] text-muted-foreground">
                    {format(new Date(r.published_at), "d MMM yyyy")} · {r.category}
                    {!r.body.trim() && " · card only (no full story)"}
                  </div>
                </div>
                {scheduled ? (
                  <Badge tone="gold">Scheduled</Badge>
                ) : r.status === "published" ? (
                  <Badge tone="green">Live</Badge>
                ) : (
                  <Badge>Draft</Badge>
                )}
                <div className="flex gap-1">
                  {r.status === "published" && r.body.trim() && (
                    <a
                      className={abtn.icon}
                      href={`/news/${r.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      title="View on site"
                      aria-label="View on site"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                  <Link
                    to="/admin/news/$id"
                    params={{ id: r.id }}
                    className={abtn.icon}
                    title="Edit"
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <ConfirmButton
                    label="Delete"
                    title="Delete this story?"
                    description={`“${r.title}” will be removed from the website. This can't be undone.`}
                    onConfirm={() => remove(r.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
