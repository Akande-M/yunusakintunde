import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, ListTree, Pencil, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { abtn, Badge, ConfirmButton, errMsg, PageTitle, Spinner } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/pages/")({
  component: PagesList,
});

type Row = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  updated_at: string;
};

function PagesList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("site_pages")
      .select("id,slug,title,status,updated_at")
      .order("title");
    if (error) {
      if (/site_pages|does not exist|schema cache/i.test(error.message)) setMissing(true);
      else toast.error(errMsg(error));
    }
    setRows((data as Row[]) ?? []);
  }, []);
  useEffect(() => void load(), [load]);

  async function remove(id: string) {
    const { error } = await db.from("site_pages").delete().eq("id", id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Page deleted");
    void load();
  }

  return (
    <>
      <PageTitle
        title="Pages"
        sub="Pages such as Outreach, Committees & Oversight or Recognition. A draft's content stays hidden from visitors. Its menu link shows a “coming soon” page until you publish it."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/menu" className={abtn.outline}>
              <ListTree className="size-4" /> Edit menu
            </Link>
            <Link to="/admin/pages/$id" params={{ id: "new" }} className={abtn.primary}>
              <Plus className="size-4" /> New page
            </Link>
          </div>
        }
      />
      {missing && (
        <p className="mb-4 rounded-sm border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          The pages table isn't set up yet. Apply the migration{" "}
          <code>20261123090000_cms_pages_and_menu.sql</code> in Lovable first.
        </p>
      )}
      {!rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pages yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border bg-card">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  to="/admin/pages/$id"
                  params={{ id: r.id }}
                  className="block truncate text-[14.5px] font-bold hover:text-primary"
                >
                  {r.title}
                </Link>
                <span className="text-[12.5px] text-muted-foreground">
                  /{r.slug} · edited {format(new Date(r.updated_at), "d MMM yyyy")}
                </span>
              </div>
              <Badge tone={r.status === "published" ? "green" : "neutral"}>
                {r.status === "published" ? "Published" : "Draft (coming soon)"}
              </Badge>
              {r.status === "published" && (
                <a
                  href={`/${r.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className={abtn.icon}
                  aria-label="View page"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
              <Link
                to="/admin/pages/$id"
                params={{ id: r.id }}
                className={abtn.icon}
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </Link>
              <ConfirmButton
                label="Delete page"
                title={`Delete “${r.title}”?`}
                description="The page is removed from the website and from the menu. This can't be undone."
                onConfirm={() => remove(r.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
