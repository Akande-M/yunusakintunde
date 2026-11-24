import { db } from "@/lib/db";

/* Where a CMS page sits in the top menu. Used by the page editor (there is no separate
   Menu screen): a page can sit at the top level or under any group, before a chosen link. */

export type MenuRow = {
  id: string;
  parent_id: string | null;
  label: string;
  href: string | null;
  page_slug: string | null;
  sort_order: number;
};

/** "none" = not in the menu, "top" = the main bar, otherwise the id of a group. */
export type Placement = { parent: string; label: string; before: string };

export const NOT_IN_MENU = "none";
export const TOP_LEVEL = "top";
export const AT_END = "end";

export async function loadMenuRows(): Promise<MenuRow[] | null> {
  const { data, error } = await db
    .from("menu_items")
    .select("id,parent_id,label,href,page_slug,sort_order")
    .order("sort_order");
  return error ? null : ((data ?? []) as MenuRow[]);
}

const depthOf = (rows: MenuRow[], id: string | null): number => {
  let d = 0;
  let cur = id;
  while (cur) {
    d++;
    cur = rows.find((r) => r.id === cur)?.parent_id ?? null;
  }
  return d;
};

/** Groups (links without their own page) a page can sit under, at most three levels deep. */
export function groupOptions(
  rows: MenuRow[],
  ownSlug?: string | null,
): { id: string; label: string }[] {
  const path = (r: MenuRow): string => {
    const parent = rows.find((x) => x.id === r.parent_id);
    return parent ? `${path(parent)} › ${r.label}` : r.label;
  };
  const order = (r: MenuRow): number[] => {
    const parent = rows.find((x) => x.id === r.parent_id);
    return parent ? [...order(parent), r.sort_order] : [r.sort_order];
  };
  return rows
    .filter(
      (r) =>
        (!ownSlug || r.page_slug !== ownSlug) &&
        ((!r.page_slug && !r.href) || rows.some((c) => c.parent_id === r.id)) &&
        depthOf(rows, r.id) < 3,
    )
    .sort((a, b) => {
      const oa = order(a);
      const ob = order(b);
      for (let i = 0; i < Math.max(oa.length, ob.length); i++) {
        const d = (oa[i] ?? -1) - (ob[i] ?? -1);
        if (d) return d;
      }
      return 0;
    })
    .map((r) => ({ id: r.id, label: path(r) }));
}

export function siblingsOf(rows: MenuRow[], parent: string, slug: string | null) {
  const pid = parent === TOP_LEVEL ? null : parent;
  return rows
    .filter((r) => r.parent_id === pid && (!slug || r.page_slug !== slug))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function currentPlacement(rows: MenuRow[], slug: string, title: string): Placement {
  const mine = rows.find((r) => r.page_slug === slug);
  if (!mine) return { parent: NOT_IN_MENU, label: title, before: AT_END };
  const sibs = rows
    .filter((r) => r.parent_id === mine.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const next = sibs[sibs.findIndex((r) => r.id === mine.id) + 1];
  return { parent: mine.parent_id ?? TOP_LEVEL, label: mine.label, before: next?.id ?? AT_END };
}

/** Writes the page's menu link. Returns an error message, or null when it worked. */
export async function applyPlacement(
  rows: MenuRow[],
  p: Placement,
  slug: string,
  oldSlug: string | null,
): Promise<string | null> {
  const slugs = [...new Set([slug, oldSlug].filter(Boolean))] as string[];
  const mine = rows.find((r) => r.page_slug && slugs.includes(r.page_slug));
  if (p.parent === NOT_IN_MENU) {
    if (!slugs.length) return null;
    // A link with sub-links stays as a plain group so its sub-links aren't removed.
    const groups = rows.filter(
      (r) => r.page_slug && slugs.includes(r.page_slug) && rows.some((c) => c.parent_id === r.id),
    );
    if (groups.length) {
      const g = await db
        .from("menu_items")
        .update({ page_slug: null })
        .in(
          "id",
          groups.map((r) => r.id),
        );
      if (g.error) return g.error.message;
    }
    const { error } = await db.from("menu_items").delete().in("page_slug", slugs);
    return error?.message ?? null;
  }
  const parentId = p.parent === TOP_LEVEL ? null : p.parent;
  const label = p.label.trim() || slug;
  let id = mine?.id;
  if (id) {
    const { error } = await db
      .from("menu_items")
      .update({ label, parent_id: parentId, page_slug: slug, visible: true })
      .eq("id", id);
    if (error) return error.message;
  } else {
    const { data, error } = await db
      .from("menu_items")
      .insert({ label, parent_id: parentId, page_slug: slug, visible: true, sort_order: 9999 })
      .select("id")
      .single();
    if (error) return error.message;
    id = (data as { id: string }).id;
  }
  // Renumber the links in that group with this page at the chosen position.
  const sibs = rows
    .filter((r) => r.parent_id === parentId && r.id !== id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => r.id);
  const at = p.before === AT_END ? -1 : sibs.indexOf(p.before);
  if (at === -1) sibs.push(id);
  else sibs.splice(at, 0, id);
  const results = await Promise.all(
    sibs.map((sid, n) =>
      db
        .from("menu_items")
        .update({ sort_order: (n + 1) * 10 })
        .eq("id", sid),
    ),
  );
  return results.find((r) => r.error)?.error?.message ?? null;
}
