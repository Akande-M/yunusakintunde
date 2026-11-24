import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  House,
  ImagePlus,
  Images,
  Newspaper,
  PanelTop,
  Pencil,
  Plus,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { abtn, Badge, ConfirmButton, errMsg, PageTitle, Spinner } from "@/components/admin/kit";
import { loadMenuRows, type MenuRow } from "@/components/admin/menu-placement";

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

/** Built-in pages: their content is edited on dedicated screens. */
const MAIN_PAGES: {
  title: string;
  view: string;
  edit: string;
  search?: { tab: string };
  what: string;
  Icon: LucideIcon;
}[] = [
  {
    title: "Home",
    view: "/",
    edit: "/admin/content",
    search: { tab: "home" },
    what: "Hero carousel, numbers, campaign film and homepage wording",
    Icon: House,
  },
  {
    title: "Header & top menu bar",
    view: "/",
    edit: "/admin/content",
    search: { tab: "header" },
    what: "Top bar (phone, email, social icons), name beside the logo, Get in touch button",
    Icon: PanelTop,
  },
  {
    title: "Biography",
    view: "/biography",
    edit: "/admin/biography",
    what: "Introduction, key facts, story, photos and timeline",
    Icon: UserRound,
  },
  {
    title: "Achievements",
    view: "/achievements",
    edit: "/admin/achievements",
    what: "Achievement cards and photos for each local government, Senate bills & motions, page heading",
    Icon: Trophy,
  },
  {
    title: "News & Updates",
    view: "/news",
    edit: "/admin/news",
    what: "Stories and the page heading",
    Icon: Newspaper,
  },
  {
    title: "Media Gallery",
    view: "/media",
    edit: "/admin/media",
    what: "Photos, videos and the page heading",
    Icon: Images,
  },
];

function PagesList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [menu, setMenu] = useState<MenuRow[]>([]);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    const [{ data, error }, m] = await Promise.all([
      db.from("site_pages").select("id,slug,title,status,updated_at").order("title"),
      loadMenuRows(),
    ]);
    if (error) {
      if (/site_pages|does not exist|schema cache/i.test(error.message)) setMissing(true);
      else toast.error(errMsg(error));
    }
    setRows((data as Row[]) ?? []);
    setMenu(m ?? []);
  }, []);
  useEffect(() => void load(), [load]);

  /** Pages grouped the way the website's top menu groups them. */
  const groups = useMemo(() => {
    if (!rows) return [];
    const byId = new Map(menu.map((r) => [r.id, r]));
    const top = (r: MenuRow): MenuRow => {
      let cur = r;
      while (cur.parent_id && byId.get(cur.parent_id)) cur = byId.get(cur.parent_id)!;
      return cur;
    };
    const out = new Map<string, { label: string; order: number; rows: Row[] }>();
    for (const r of rows) {
      const mine = menu.find((m) => m.page_slug === r.slug);
      const t = mine ? top(mine) : null;
      const key = t ? t.id : "_none";
      const g = out.get(key) ?? {
        label: t ? t.label : "Not in the menu",
        order: t ? (t.sort_order ?? 0) : 1e9,
        rows: [],
      };
      g.rows.push(r);
      out.set(key, g);
    }
    return [...out.values()].sort((a, b) => a.order - b.order);
  }, [rows, menu]);

  const placeOf = useMemo(() => {
    const byId = new Map(menu.map((r) => [r.id, r]));
    const path = (r: MenuRow | undefined): string =>
      !r ? "" : r.parent_id ? `${path(byId.get(r.parent_id))} › ${r.label}` : r.label;
    return (slug: string) => {
      const mine = menu.find((r) => r.page_slug === slug);
      if (!mine) return "Not in the menu";
      const parent = mine.parent_id ? byId.get(mine.parent_id) : undefined;
      return parent ? `Menu: ${path(parent)}` : "Menu: main bar";
    };
  }, [menu]);

  async function remove(r: Row) {
    const { error } = await db.from("site_pages").delete().eq("id", r.id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    // Keep a menu group that has sub-links; just unlink it from the deleted page.
    const own = menu.filter((m) => m.page_slug === r.slug);
    for (const m of own) {
      const hasKids = menu.some((c) => c.parent_id === m.id);
      if (hasKids) await db.from("menu_items").update({ page_slug: null }).eq("id", m.id);
      else await db.from("menu_items").delete().eq("id", m.id);
    }
    toast.success("Page deleted");
    void load();
  }

  return (
    <>
      <PageTitle
        title="Pages"
        sub="Every page on the website. Main pages have their own editors. Other pages are built from sections, and each one chooses its place in the top menu."
        action={
          <Link to="/admin/pages/$id" params={{ id: "new" }} className={abtn.primary}>
            <Plus className="size-4" /> New page
          </Link>
        }
      />

      <h2 className="mb-3 font-serif text-[19px] font-semibold">Main pages</h2>
      <ul className="mb-9 grid gap-3 md:grid-cols-2">
        {MAIN_PAGES.map((p) => (
          <li
            key={p.title}
            className="flex items-start gap-3.5 rounded-sm border border-border bg-card p-4"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-tint text-primary">
              <p.Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <Link
                to={p.edit as "/admin/content"}
                search={p.search as never}
                className="block text-[14.5px] font-bold hover:text-primary"
              >
                {p.title}
              </Link>
              <span className="block text-[12.5px] text-muted-foreground">{p.what}</span>
            </div>
            <a
              href={p.view}
              target="_blank"
              rel="noreferrer"
              className={abtn.icon}
              aria-label={`View ${p.title}`}
            >
              <ExternalLink className="size-4" />
            </a>
            <Link
              to={p.edit as "/admin/content"}
              search={p.search as never}
              className={abtn.icon}
              aria-label={`Edit ${p.title}`}
            >
              <Pencil className="size-4" />
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 font-serif text-[19px] font-semibold">Pages in the top menu</h2>
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
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.label}>
              <h3 className="mb-2 text-[12px] font-extrabold tracking-[0.08em] text-accent-deep uppercase">
                {g.label}
              </h3>
              <ul className="divide-y divide-border rounded-sm border border-border bg-card">
                {g.rows.map((r) => (
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
                        /{r.slug} · {placeOf(r.slug)} · edited{" "}
                        {format(new Date(r.updated_at), "d MMM yyyy")}
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
                      to="/admin/photos"
                      search={{ page: r.id }}
                      className={abtn.icon}
                      aria-label={`Add photos to ${r.title}`}
                      title="Add photos"
                    >
                      <ImagePlus className="size-4" />
                    </Link>
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
                      description="The page and its link in the top menu are removed. This can't be undone."
                      onConfirm={() => remove(r)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
