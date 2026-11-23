import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { BUILT_IN_LINKS } from "@/lib/pages";
import { NAV_ICONS, navIcon } from "@/lib/nav-icons";
import {
  abtn,
  Badge,
  ConfirmButton,
  EditDialog,
  errMsg,
  Field,
  inputCls,
  PageTitle,
  Spinner,
} from "@/components/admin/kit";

export const Route = createFileRoute("/admin/menu")({
  component: MenuEditor,
});

type Item = {
  id: string;
  parent_id: string | null;
  label: string;
  href: string | null;
  page_slug: string | null;
  visible: boolean;
  sort_order: number;
  icon?: string | null;
};
type PageRef = { slug: string; title: string; status: "draft" | "published" };
function DraftIcon({ label, icon }: { label: string; icon: string }) {
  const Ico = navIcon(label, icon);
  return <Ico className="size-5" />;
}

type LinkKind = "page" | "builtin" | "url" | "none";
type Draft = {
  id?: string;
  label: string;
  parent_id: string | null;
  kind: LinkKind;
  page_slug: string;
  href: string;
  visible: boolean;
  icon: string;
};

const MAX_DEPTH = 3;

function kindOf(i: Item): LinkKind {
  if (i.page_slug) return "page";
  if (!i.href) return "none";
  return BUILT_IN_LINKS.some((b) => b.href === i.href) ? "builtin" : "url";
}

function MenuEditor() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [pages, setPages] = useState<PageRef[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);
  const [noIcons, setNoIcons] = useState(false);

  const load = useCallback(async () => {
    const loadMenu = async () => {
      const cols = "id,parent_id,label,href,page_slug,visible,sort_order";
      const withIcon = await db.from("menu_items").select(`${cols},icon`).order("sort_order");
      if (!withIcon.error) {
        setNoIcons(false);
        return withIcon;
      }
      // The icon column arrives with migration 20261123130000.
      setNoIcons(true);
      return db.from("menu_items").select(cols).order("sort_order");
    };
    const [m, p] = await Promise.all([
      loadMenu(),
      db.from("site_pages").select("slug,title,status").order("title"),
    ]);
    if (m.error) {
      if (/menu_items|does not exist|schema cache/i.test(m.error.message)) setMissing(true);
      else toast.error(errMsg(m.error));
    }
    setItems((m.data as Item[]) ?? []);
    setPages((p.data as PageRef[]) ?? []);
  }, []);
  useEffect(() => void load(), [load]);

  const children = useMemo(() => {
    const map = new Map<string | null, Item[]>();
    for (const i of items ?? []) {
      const l = map.get(i.parent_id) ?? [];
      l.push(i);
      map.set(i.parent_id, l);
    }
    for (const l of map.values()) l.sort((a, b) => a.sort_order - b.sort_order);
    return map;
  }, [items]);

  const depthOf = useCallback(
    (id: string | null): number => {
      let d = 0;
      let cur = id;
      while (cur) {
        d++;
        cur = items?.find((i) => i.id === cur)?.parent_id ?? null;
      }
      return d;
    },
    [items],
  );

  const pageBySlug = useMemo(() => new Map(pages.map((p) => [p.slug, p])), [pages]);

  function describe(i: Item): { text: string; hidden?: string } {
    if (i.page_slug) {
      const p = pageBySlug.get(i.page_slug);
      if (!p) return { text: `Page /${i.page_slug}`, hidden: "Page missing" };
      return {
        text: `Page: ${p.title}`,
        ...(p.status !== "published"
          ? { hidden: "Shows “coming soon” until the page is published" }
          : {}),
      };
    }
    if (i.href) return { text: BUILT_IN_LINKS.find((b) => b.href === i.href)?.label ?? i.href };
    const hasKids = (children.get(i.id) ?? []).length > 0;
    return {
      text: "Group (opens a drop-down)",
      ...(hasKids ? {} : { hidden: "Hidden: nothing inside" }),
    };
  }

  /** Items this one could sit under (no loops, at most three levels). */
  function parentOptions(selfId?: string) {
    const banned = new Set<string>();
    if (selfId) {
      const walk = (id: string) => {
        banned.add(id);
        for (const c of children.get(id) ?? []) walk(c.id);
      };
      walk(selfId);
    }
    const subtreeHeight = (id?: string): number =>
      !id ? 1 : 1 + Math.max(0, ...(children.get(id) ?? []).map((c) => subtreeHeight(c.id)));
    const h = subtreeHeight(selfId);
    return (items ?? []).filter((i) => !banned.has(i.id) && depthOf(i.id) + h <= MAX_DEPTH);
  }

  function startNew(parent_id: string | null) {
    setDraft({
      label: "",
      parent_id,
      kind: "page",
      page_slug: pages[0]?.slug ?? "",
      href: "",
      visible: true,
      icon: "",
    });
  }
  function startEdit(i: Item) {
    setDraft({
      id: i.id,
      label: i.label,
      parent_id: i.parent_id,
      kind: kindOf(i),
      page_slug: i.page_slug ?? "",
      href: i.href ?? "",
      visible: i.visible,
      icon: i.icon ?? "",
    });
  }

  async function save() {
    if (!draft) return;
    if (!draft.label.trim()) {
      toast.error("Add the menu text.");
      return;
    }
    if (draft.kind === "page" && !draft.page_slug) {
      toast.error("Choose a page.");
      return;
    }
    if (draft.kind === "url" && !/^(\/|https?:\/\/|mailto:|tel:)/.test(draft.href.trim())) {
      toast.error("A link must start with / or https://");
      return;
    }
    const payload = {
      label: draft.label.trim(),
      parent_id: draft.parent_id,
      page_slug: draft.kind === "page" ? draft.page_slug : null,
      href: draft.kind === "builtin" || draft.kind === "url" ? draft.href.trim() : null,
      visible: draft.visible,
      ...(noIcons ? {} : { icon: draft.icon || null }),
    };
    setSaving(true);
    const existing = items?.find((i) => i.id === draft.id);
    const res =
      draft.id && existing
        ? await db
            .from("menu_items")
            .update(
              existing.parent_id === draft.parent_id
                ? payload
                : { ...payload, sort_order: nextOrder(draft.parent_id) },
            )
            .eq("id", draft.id)
        : await db
            .from("menu_items")
            .insert({ ...payload, sort_order: nextOrder(draft.parent_id) });
    setSaving(false);
    if (res.error) {
      toast.error(errMsg(res.error));
      return;
    }
    toast.success("Menu saved. The website updates within a minute.");
    setDraft(null);
    void load();
  }

  function nextOrder(parent: string | null) {
    const sibs = children.get(parent) ?? [];
    return (sibs.at(-1)?.sort_order ?? 0) + 10;
  }

  async function move(i: Item, d: -1 | 1) {
    const sibs = children.get(i.parent_id) ?? [];
    const idx = sibs.findIndex((s) => s.id === i.id);
    const other = sibs[idx + d];
    if (!other) return;
    // Renumber the siblings so equal sort orders can't get stuck.
    const order = [...sibs];
    [order[idx], order[idx + d]] = [order[idx + d]!, order[idx]!];
    const results = await Promise.all(
      order.map((s, n) =>
        db
          .from("menu_items")
          .update({ sort_order: (n + 1) * 10 })
          .eq("id", s.id),
      ),
    );
    const err = results.find((r) => r.error)?.error;
    if (err) toast.error(errMsg(err));
    void load();
  }

  async function toggle(i: Item) {
    const { error } = await db.from("menu_items").update({ visible: !i.visible }).eq("id", i.id);
    if (error) toast.error(errMsg(error));
    void load();
  }

  async function remove(i: Item) {
    const { error } = await db.from("menu_items").delete().eq("id", i.id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Removed from the menu");
    void load();
  }

  function Rows({ parent, depth }: { parent: string | null; depth: number }) {
    const list = children.get(parent) ?? [];
    return (
      <>
        {list.map((i, n) => {
          const info = describe(i);
          const kids = children.get(i.id) ?? [];
          return (
            <div key={i.id}>
              <div
                className={`flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 ${i.visible ? "" : "opacity-60"}`}
                style={{ paddingLeft: 16 + (depth - 1) * 28 }}
              >
                {depth > 1 && (
                  <span aria-hidden className="text-muted-foreground">
                    └
                  </span>
                )}
                {depth > 1 && (
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-tint text-primary">
                    <DraftIcon label={i.label} icon={i.icon ?? ""} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-bold">{i.label}</div>
                  <div className="text-[12.5px] text-muted-foreground">{info.text}</div>
                </div>
                {!i.visible && <Badge>Switched off</Badge>}
                {i.visible && info.hidden && <Badge tone="gold">{info.hidden}</Badge>}
                <button
                  type="button"
                  className={abtn.icon}
                  disabled={n === 0}
                  onClick={() => void move(i, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  className={abtn.icon}
                  disabled={n === list.length - 1}
                  onClick={() => void move(i, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  className={abtn.icon}
                  onClick={() => void toggle(i)}
                  aria-label={i.visible ? "Hide from menu" : "Show in menu"}
                >
                  {i.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                {depth < MAX_DEPTH && (
                  <button
                    type="button"
                    className={abtn.icon}
                    onClick={() => startNew(i.id)}
                    aria-label={`Add a link under ${i.label}`}
                  >
                    <Plus className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  className={abtn.icon}
                  onClick={() => startEdit(i)}
                  aria-label="Edit"
                >
                  <Pencil className="size-4" />
                </button>
                <ConfirmButton
                  label="Remove"
                  title={`Remove “${i.label}” from the menu?`}
                  description={
                    kids.length
                      ? `Everything inside it (${kids.length} link${kids.length > 1 ? "s" : ""}) is removed too. Pages themselves are not deleted.`
                      : "The page itself is not deleted."
                  }
                  onConfirm={() => remove(i)}
                />
              </div>
              <Rows parent={i.id} depth={depth + 1} />
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Menu"
        sub="The top navigation of the website. Links with links inside them open as a drop-down. Use + on a row to add a link under it (up to three levels)."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/pages" className={abtn.outline}>
              Pages
            </Link>
            <button type="button" className={abtn.primary} onClick={() => startNew(null)}>
              <Plus className="size-4" /> Add top-level link
            </button>
          </div>
        }
      />
      {missing && (
        <p className="mb-4 rounded-sm border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          The menu table isn't set up yet, so the website shows a basic built-in menu. Apply the
          migration <code>20261123090000_cms_pages_and_menu.sql</code> in Lovable first.
        </p>
      )}
      {!items ? (
        <Spinner />
      ) : (
        <div className="rounded-sm border border-border bg-card">
          <Rows parent={null} depth={1} />
          {items.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">The menu is empty.</p>
          )}
        </div>
      )}
      <p className="mt-3 text-[13px] text-muted-foreground">
        The “Get in touch” button is always shown at the end of the menu.
      </p>

      <EditDialog
        open={!!draft}
        title={draft?.id ? "Edit menu link" : "Add menu link"}
        onClose={() => setDraft(null)}
        onSave={() => void save()}
        saving={saving}
      >
        {draft && (
          <>
            <Field label="Menu text">
              <input
                className={inputCls}
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </Field>
            <Field label="Sits under">
              <select
                className={inputCls}
                value={draft.parent_id ?? ""}
                onChange={(e) => setDraft({ ...draft, parent_id: e.target.value || null })}
              >
                <option value="">Top level (always visible in the bar)</option>
                {parentOptions(draft.id).map((p) => (
                  <option key={p.id} value={p.id}>
                    {"— ".repeat(depthOf(p.id) - 1)}
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Opens">
              <select
                className={inputCls}
                value={draft.kind}
                onChange={(e) => {
                  const kind = e.target.value as LinkKind;
                  setDraft({
                    ...draft,
                    kind,
                    href:
                      kind === "builtin"
                        ? (BUILT_IN_LINKS[0]?.href ?? "/")
                        : kind === "url"
                          ? ""
                          : draft.href,
                  });
                }}
              >
                <option value="page">A page made in Pages</option>
                <option value="builtin">A built-in page (Home, Biography, News…)</option>
                <option value="url">Another web address</option>
                <option value="none">Nothing: it's a group that opens a drop-down</option>
              </select>
            </Field>
            {draft.kind === "page" && (
              <Field
                label="Page"
                hint="A draft page shows a “coming soon” page until it's published."
              >
                <select
                  className={inputCls}
                  value={draft.page_slug}
                  onChange={(e) => setDraft({ ...draft, page_slug: e.target.value })}
                >
                  {pages.length === 0 && <option value="">No pages yet</option>}
                  {pages.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.title}
                      {p.status === "published" ? "" : " (draft)"}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {draft.kind === "builtin" && (
              <Field label="Built-in page">
                <select
                  className={inputCls}
                  value={draft.href}
                  onChange={(e) => setDraft({ ...draft, href: e.target.value })}
                >
                  {BUILT_IN_LINKS.map((b) => (
                    <option key={b.href} value={b.href}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {draft.kind === "url" && (
              <Field label="Web address" hint="For example /news#latest or https://apc.com.ng">
                <input
                  className={inputCls}
                  value={draft.href}
                  onChange={(e) => setDraft({ ...draft, href: e.target.value })}
                />
              </Field>
            )}
            <Field
              label="Icon"
              hint={
                noIcons
                  ? "Icons can be chosen once the latest database update is applied. Until then each link gets one from its wording."
                  : "Shown beside the link in the drop-down. “Automatic” picks one from the menu text."
              }
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-tint text-primary">
                  <DraftIcon label={draft.label} icon={draft.icon} />
                </span>
                <select
                  className={inputCls}
                  disabled={noIcons}
                  value={draft.icon}
                  onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                >
                  <option value="">Automatic</option>
                  {Object.entries(NAV_ICONS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={draft.visible}
                onChange={(e) => setDraft({ ...draft, visible: e.target.checked })}
              />
              Show in the menu
            </label>
          </>
        )}
      </EditDialog>
    </>
  );
}
