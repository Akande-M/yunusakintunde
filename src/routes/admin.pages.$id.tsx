import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  ExternalLink,
  MapPin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { ZONES } from "@/lib/lgas";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { getAchievements, getRecord } from "@/lib/cms";
import {
  getAreaSections,
  getSubpages,
  blankSection,
  normalizeSections,
  RESERVED_SLUGS,
  SECTION_LABELS,
  TOPIC_LABELS,
  type PageSection,
  type SitePage,
  type Topic,
} from "@/lib/pages";
import {
  applyPlacement,
  AT_END,
  currentPlacement,
  groupOptions,
  loadMenuRows,
  NOT_IN_MENU,
  siblingsOf,
  TOP_LEVEL,
  type MenuRow,
  type Placement,
} from "@/components/admin/menu-placement";
import {
  needsAchievements,
  needsAreas,
  needsProjects,
  needsSubpages,
  PageView,
  type PageData,
} from "@/components/site/PageView";
import {
  abtn,
  Badge,
  Card,
  errMsg,
  Field,
  ImageField,
  inputCls,
  placeholderWarning,
  Spinner,
} from "@/components/admin/kit";

export const Route = createFileRoute("/admin/pages/$id")({
  component: PageEditor,
});

type Page = {
  id?: string;
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  hero_image: string;
  hero_alt: string;
  seo_description: string;
  sections: PageSection[];
  status: "draft" | "published";
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");

const blank = (): Page => ({
  slug: "",
  title: "",
  eyebrow: "",
  intro: "",
  hero_image: "",
  hero_alt: "",
  seo_description: "",
  sections: [blankSection("text")],
  status: "draft",
});

/** True when any text on the page still has [placeholder] text, checked before publishing. */
function hasPlaceholder(p: Page): boolean {
  const texts: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") texts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk([p.title, p.eyebrow, p.intro, p.sections]);
  return texts.some((t) => /\[[^\]]+\]/.test(t));
}

function Mover({
  i,
  n,
  move,
  remove,
  label,
}: {
  i: number;
  n: number;
  move: (i: number, d: -1 | 1) => void;
  remove: (i: number) => void;
  label: string;
}) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        className={abtn.icon}
        disabled={i === 0}
        onClick={() => move(i, -1)}
        aria-label={`Move ${label} up`}
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        className={abtn.icon}
        disabled={i === n - 1}
        onClick={() => move(i, 1)}
        aria-label={`Move ${label} down`}
      >
        <ArrowDown className="size-4" />
      </button>
      <button
        type="button"
        className={abtn.icon}
        onClick={() => remove(i)}
        aria-label={`Remove ${label}`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function reorder<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

/** Local government picker: "" means the section is about the whole district. */
function LgaSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
      <MapPin className="size-4 text-primary" aria-hidden />
      <span className="sr-only">Local government</span>
      <select
        className={`${inputCls} !min-h-9 !py-1 text-[13px]`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Whole district (not in a tab)</option>
        {ZONES.map((z) => (
          <optgroup key={z.zone} label={`${z.zone} zone`}>
            {z.lgas.map((l) => (
              <option key={l} value={l}>
                {l} tab
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

/** Optional photo beside a list's or cards' heading. */
function SectionPhoto({
  s,
  onChange,
}: {
  s: Extract<PageSection, { type: "list" | "cards" }>;
  onChange: (s: PageSection) => void;
}) {
  return (
    <>
      <Field label="Section photo (optional)" hint="Shown beside the heading.">
        <ImageField
          value={s.image ?? ""}
          onChange={(image) => onChange({ ...s, image })}
          folder="pages"
          shapes
        />
      </Field>
      {s.image && (
        <Field label="Photo caption">
          <input
            className={inputCls}
            value={s.caption ?? ""}
            onChange={(e) => onChange({ ...s, caption: e.target.value })}
          />
        </Field>
      )}
    </>
  );
}

/** Short summary of a section for its collapsed header. */
function sectionSummary(s: PageSection): string {
  const n =
    s.type === "gallery"
      ? `${s.images.length} photo${s.images.length === 1 ? "" : "s"}`
      : s.type === "list" || s.type === "cards"
        ? `${s.items.length} item${s.items.length === 1 ? "" : "s"}`
        : "";
  return [n].filter(Boolean).join(" · ");
}

function SectionFields({ s, onChange }: { s: PageSection; onChange: (s: PageSection) => void }) {
  switch (s.type) {
    case "text":
      return (
        <>
          <Field label="Heading">
            <input
              className={inputCls}
              value={s.heading}
              onChange={(e) => onChange({ ...s, heading: e.target.value })}
            />
          </Field>
          <Field
            label="Text"
            hint="Leave an empty line between paragraphs."
            warn={placeholderWarning(s.body)}
          >
            <textarea
              rows={7}
              className={inputCls}
              value={s.body}
              onChange={(e) => onChange({ ...s, body: e.target.value })}
            />
          </Field>
          <Field label="Photo (optional)">
            <ImageField
              value={s.image}
              onChange={(image) => onChange({ ...s, image })}
              folder="pages"
              shapes
            />
          </Field>
          {s.image && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Photo caption">
                <input
                  className={inputCls}
                  value={s.caption}
                  onChange={(e) => onChange({ ...s, caption: e.target.value })}
                />
              </Field>
              <Field label="Photo position">
                <select
                  className={inputCls}
                  value={s.imageSide}
                  onChange={(e) =>
                    onChange({ ...s, imageSide: e.target.value as "left" | "right" })
                  }
                >
                  <option value="right">Right of the text</option>
                  <option value="left">Left of the text</option>
                </select>
              </Field>
            </div>
          )}
          {s.image && (
            <>
              <Field
                label="Second photo (optional)"
                hint="Shown overlapping the corner of the first photo."
              >
                <ImageField
                  value={s.image2 ?? ""}
                  onChange={(image2) => onChange({ ...s, image2 })}
                  folder="pages"
                  shapes
                />
              </Field>
              {s.image2 && (
                <Field label="Second photo caption">
                  <input
                    className={inputCls}
                    value={s.caption2 ?? ""}
                    onChange={(e) => onChange({ ...s, caption2: e.target.value })}
                  />
                </Field>
              )}
            </>
          )}
        </>
      );
    case "cards":
      return (
        <>
          <Field label="Heading">
            <input
              className={inputCls}
              value={s.heading}
              onChange={(e) => onChange({ ...s, heading: e.target.value })}
            />
          </Field>
          <Field label="Short intro (optional)">
            <textarea
              rows={2}
              className={inputCls}
              value={s.intro}
              onChange={(e) => onChange({ ...s, intro: e.target.value })}
            />
          </Field>
          <SectionPhoto s={s} onChange={onChange} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Button under the cards (optional)" hint="e.g. See the awards in pictures">
              <input
                className={inputCls}
                value={s.moreLabel ?? ""}
                onChange={(e) => onChange({ ...s, moreLabel: e.target.value })}
              />
            </Field>
            <Field
              label="Button link"
              hint="A page (/media) or a gallery on this page: # and its heading in small letters with dashes, e.g. #recognition-in-pictures"
            >
              <input
                className={inputCls}
                value={s.moreHref ?? ""}
                onChange={(e) => onChange({ ...s, moreHref: e.target.value })}
              />
            </Field>
          </div>
          <div className="space-y-3">
            {s.items.map((c, i) => (
              <div key={i} className="rounded-sm border border-border bg-paper-2 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold">Card {i + 1}</span>
                  <Mover
                    i={i}
                    n={s.items.length}
                    label="card"
                    move={(a, d) => onChange({ ...s, items: reorder(s.items, a, d) })}
                    remove={(a) => onChange({ ...s, items: s.items.filter((_, j) => j !== a) })}
                  />
                </div>
                <Field label="Title" warn={placeholderWarning(c.title)}>
                  <input
                    className={inputCls}
                    value={c.title}
                    onChange={(e) =>
                      onChange({
                        ...s,
                        items: s.items.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Text" warn={placeholderWarning(c.text)}>
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={c.text}
                    onChange={(e) =>
                      onChange({
                        ...s,
                        items: s.items.map((x, j) =>
                          j === i ? { ...x, text: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Photo (optional)">
                  <ImageField
                    value={c.image}
                    folder="pages"
                    shapes
                    onChange={(image) =>
                      onChange({
                        ...s,
                        items: s.items.map((x, j) => (j === i ? { ...x, image } : x)),
                      })
                    }
                  />
                </Field>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`${abtn.outline} mt-3`}
            onClick={() =>
              onChange({ ...s, items: [...s.items, { title: "", text: "", image: "" }] })
            }
          >
            <Plus className="size-4" /> Add card
          </button>
        </>
      );
    case "gallery":
      return (
        <>
          <Field label="Heading">
            <input
              className={inputCls}
              value={s.heading}
              onChange={(e) => onChange({ ...s, heading: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.images.map((g, i) => (
              <div key={i} className="rounded-sm border border-border bg-paper-2 p-3">
                <div className="mb-2 flex justify-end">
                  <Mover
                    i={i}
                    n={s.images.length}
                    label="photo"
                    move={(a, d) => onChange({ ...s, images: reorder(s.images, a, d) })}
                    remove={(a) => onChange({ ...s, images: s.images.filter((_, j) => j !== a) })}
                  />
                </div>
                <ImageField
                  value={g.url}
                  folder="pages"
                  shapes
                  defaultShape="original"
                  onChange={(url) =>
                    onChange({
                      ...s,
                      images: s.images.map((x, j) => (j === i ? { ...x, url } : x)),
                    })
                  }
                />
                <input
                  className={`${inputCls} mt-2`}
                  placeholder="Caption"
                  value={g.caption}
                  onChange={(e) =>
                    onChange({
                      ...s,
                      images: s.images.map((x, j) =>
                        j === i ? { ...x, caption: e.target.value } : x,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`${abtn.outline} mt-3`}
            onClick={() => onChange({ ...s, images: [...s.images, { url: "", caption: "" }] })}
          >
            <Plus className="size-4" /> Add photo
          </button>
        </>
      );
    case "list":
      return (
        <>
          <Field label="Heading">
            <input
              className={inputCls}
              value={s.heading}
              onChange={(e) => onChange({ ...s, heading: e.target.value })}
            />
          </Field>
          <Field label="Short intro (optional)">
            <textarea
              rows={2}
              className={inputCls}
              value={s.intro}
              onChange={(e) => onChange({ ...s, intro: e.target.value })}
            />
          </Field>
          <SectionPhoto s={s} onChange={onChange} />
          <Field label="Style">
            <select
              className={inputCls}
              value={s.style ?? "numbered"}
              onChange={(e) => onChange({ ...s, style: e.target.value as "numbered" | "bulleted" })}
            >
              <option value="numbered">Numbered (1, 2, 3)</option>
              <option value="bulleted">Bullet points</option>
            </select>
          </Field>
          <Field
            label="Items"
            hint="One item per line, numbered automatically. To show a bold title with a description under it, write: Title: description"
          >
            <textarea
              rows={Math.max(5, s.items.length + 1)}
              className={inputCls}
              value={s.items.join("\n")}
              onChange={(e) => onChange({ ...s, items: e.target.value.split("\n") })}
            />
          </Field>
          <Field label="Closing text (optional)" hint="Shown under the list.">
            <textarea
              rows={2}
              className={inputCls}
              value={s.outro ?? ""}
              onChange={(e) => onChange({ ...s, outro: e.target.value })}
            />
          </Field>
        </>
      );
    default: {
      const where =
        s.type === "projects"
          ? "The projects themselves are edited in Record & Agenda → Projects."
          : s.type === "legislative"
            ? "The bills and motions are edited in Achievements → the “Legislative Duties” (Senate) card."
            : s.type === "subpages"
              ? "Shows one tab for each page linked under this page in the top menu, with that page's content. Edit those pages and this updates too."
              : s.type === "areas"
                ? "Shows tabs for the 11 local governments, filled with every section tagged with a local government on the Outreach, Infrastructure and Skills pages. Edit those pages and this updates too."
                : "Shows tabs for the 11 local governments. Each tab holds this page's sections tagged with that local government, plus matching items from Achievements.";
      return (
        <>
          <p className="mb-4 rounded-sm bg-primary-tint px-3 py-2 text-[13px] text-primary">
            {where}
          </p>
          {s.type === "topic" && (
            <Field label="Topic">
              <select
                className={inputCls}
                value={s.topic}
                onChange={(e) => onChange({ ...s, topic: e.target.value as Topic })}
              >
                {(Object.keys(TOPIC_LABELS) as Topic[]).map((t) => (
                  <option key={t} value={t}>
                    {TOPIC_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Heading (optional)">
            <input
              className={inputCls}
              value={s.heading}
              onChange={(e) => onChange({ ...s, heading: e.target.value })}
            />
          </Field>
          <Field label="Short intro (optional)">
            <textarea
              rows={2}
              className={inputCls}
              value={s.intro}
              onChange={(e) => onChange({ ...s, intro: e.target.value })}
            />
          </Field>
        </>
      );
    }
  }
}

function PageEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(isNew ? blank() : null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [adding, setAdding] = useState<PageSection["type"]>("text");
  const [filter, setFilter] = useState("*");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const [preview, setPreview] = useState<PageData | null>(null);
  const [menuRows, setMenuRows] = useState<MenuRow[] | null>(null);
  const [placement, setPlacement] = useState<Placement>({
    parent: NOT_IN_MENU,
    label: "",
    before: AT_END,
  });

  useEffect(() => {
    if (isNew) return;
    void db
      .from("site_pages")
      .select("id,slug,title,eyebrow,intro,hero_image,hero_alt,seo_description,sections,status")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error(error ? errMsg(error) : "Page not found");
          void navigate({ to: "/admin/pages" });
          return;
        }
        const d = data as Page & { hero_image: string | null; sections: unknown };
        setPage({ ...d, hero_image: d.hero_image ?? "", sections: normalizeSections(d.sections) });
        setSavedSlug(d.slug);
        void loadMenuRows().then((rows) => {
          setMenuRows(rows);
          if (rows) setPlacement(currentPlacement(rows, d.slug, d.title));
        });
      });
  }, [id, isNew, navigate]);

  useEffect(() => {
    if (isNew) void loadMenuRows().then(setMenuRows);
  }, [isNew]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!page) return <Spinner />;

  const set = <K extends keyof Page>(k: K, v: Page[K]) => {
    setDirty(true);
    setPage((p) => {
      if (!p) return p;
      const next = { ...p, [k]: v };
      if (k === "title" && !slugTouched) next.slug = slugify(String(v));
      return next;
    });
  };
  const setSection = (i: number, s: PageSection) =>
    set(
      "sections",
      page.sections.map((x, j) => (j === i ? s : x)),
    );

  async function openPreview() {
    if (!page) return;
    const p = asSitePage(page);
    const [record, cards, areas, subpages] = await Promise.all([
      needsProjects(p) ? getRecord() : null,
      needsAchievements(p) ? getAchievements() : null,
      needsAreas(p) ? getAreaSections() : null,
      needsSubpages(p) ? getSubpages(p.slug) : null,
    ]);
    setPreview({
      projects: record?.projects ?? [],
      cards: cards ?? [],
      areas: areas ?? [],
      subpages: subpages ?? [],
    });
  }

  async function save(status: Page["status"]) {
    if (!page) return;
    const slug = page.slug.replace(/^-+|-+$/g, "") || slugify(page.title);
    if (!page.title.trim()) {
      toast.error("Add a page title first.");
      return;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      toast.error("The web address can only use lowercase letters, numbers and dashes.");
      return;
    }
    if (RESERVED_SLUGS.includes(slug)) {
      toast.error(`“/${slug}” is already used by a built-in page. Choose another web address.`);
      return;
    }
    if (status === "published" && hasPlaceholder(page)) {
      toast.error(
        "This page still has placeholder text in [brackets]. Replace it before publishing.",
      );
      return;
    }
    setSaving(true);
    const payload = {
      slug,
      title: page.title.trim(),
      eyebrow: page.eyebrow.trim(),
      intro: page.intro.trim(),
      hero_image: page.hero_image || null,
      hero_alt: page.hero_alt.trim(),
      seo_description: page.seo_description.trim(),
      sections: page.sections.map((x) =>
        x.type === "list" ? { ...x, items: x.items.map((t) => t.trim()).filter(Boolean) } : x,
      ),
      status,
    };
    const res = page.id
      ? await db.from("site_pages").update(payload).eq("id", page.id).select("id").single()
      : await db.from("site_pages").insert(payload).select("id").single();
    if (res.error) {
      setSaving(false);
      toast.error(errMsg(res.error));
      return;
    }
    // Put the page in the top menu where the editor chose (and follow a changed web address).
    if (menuRows) {
      const err = await applyPlacement(
        menuRows,
        { ...placement, label: placement.label.trim() || payload.title },
        slug,
        savedSlug,
      );
      if (err) toast.error(`Saved, but the menu wasn't updated: ${err}`);
      const fresh = await loadMenuRows();
      if (fresh) {
        setMenuRows(fresh);
        setPlacement(currentPlacement(fresh, slug, payload.title));
      }
    }
    setSaving(false);
    setDirty(false);
    setSavedSlug(slug);
    toast.success(
      status === "published"
        ? "Published. It's live on the website."
        : "Saved as a draft. Visitors see “coming soon” until you publish.",
    );
    const newId = (res.data as { id: string }).id;
    if (isNew) {
      void navigate({ to: "/admin/pages/$id", params: { id: newId }, replace: true });
    }
    setPage({ ...page, id: newId, slug, status });
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/pages"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> All pages
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={page.status === "published" ? "green" : "neutral"}>
            {page.status === "published" ? "Published" : "Draft (coming soon)"}
          </Badge>
          {page.status === "published" && savedSlug && (
            <a href={`/${savedSlug}`} target="_blank" rel="noreferrer" className={abtn.outline}>
              <ExternalLink className="size-4" /> View
            </a>
          )}
          <button type="button" className={abtn.outline} onClick={() => void openPreview()}>
            <Eye className="size-4" /> Preview
          </button>
          <button
            type="button"
            className={abtn.outline}
            disabled={saving}
            onClick={() => void save("draft")}
          >
            {page.status === "published" ? "Unpublish" : "Save draft"}
          </button>
          <button
            type="button"
            className={abtn.primary}
            disabled={saving}
            onClick={() => void save("published")}
          >
            {page.status === "published" ? "Save & update" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card>
            <Field label="Page title" warn={placeholderWarning(page.title)}>
              <input
                className={inputCls}
                value={page.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field
              label="Small label above the title (optional)"
              hint="For example “Legislative work”."
            >
              <input
                className={inputCls}
                value={page.eyebrow}
                onChange={(e) => set("eyebrow", e.target.value)}
              />
            </Field>
            <Field label="Introduction" warn={placeholderWarning(page.intro)}>
              <textarea
                rows={3}
                className={inputCls}
                value={page.intro}
                onChange={(e) => set("intro", e.target.value)}
              />
            </Field>
          </Card>

          <Card>
            <Field label="Main photo (top of the page)">
              <ImageField
                value={page.hero_image}
                onChange={(v) => set("hero_image", v)}
                folder="pages"
                shapes
              />
            </Field>
            <Field
              label="Photo description"
              hint="Describes the photo for screen readers and search engines."
            >
              <input
                className={inputCls}
                value={page.hero_alt}
                onChange={(e) => set("hero_alt", e.target.value)}
              />
            </Field>
          </Card>
          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-[20px] font-semibold">Sections</h2>
                <p className="text-[12.5px] text-muted-foreground">
                  Click a section to open it. Pick a local government to put a section under that
                  local government's tab on the website.
                </p>
              </div>
              <label className="text-[12.5px] font-semibold">
                <span className="mb-1 block">Show</span>
                <select
                  className={`${inputCls} !min-h-9 !py-1 text-[13px]`}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="*">All sections ({page.sections.length})</option>
                  <option value="">
                    Whole district ({page.sections.filter((x) => !x.lga).length})
                  </option>
                  {ZONES.map((z) => (
                    <optgroup key={z.zone} label={`${z.zone} zone`}>
                      {z.lgas.map((l) => (
                        <option key={l} value={l}>
                          {l} ({page.sections.filter((x) => x.lga === l).length})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
            <datalist id="page-tab-names">
              {[...new Set(page.sections.map((x) => x.tab).filter(Boolean))].map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <div className="space-y-3">
              {page.sections.map((s, i) => {
                if (filter !== "*" && (s.lga ?? "") !== filter) return null;
                const isOpen = open.has(i);
                return (
                  <Card key={i} className={isOpen ? "border-primary/50" : ""}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                        aria-expanded={isOpen}
                        onClick={() => toggle(i)}
                      >
                        {isOpen ? (
                          <ChevronDown className="size-4 shrink-0 text-primary" />
                        ) : (
                          <ChevronRight className="size-4 shrink-0 text-primary" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-[14.5px] font-bold">
                            {i + 1}. {("heading" in s && s.heading) || SECTION_LABELS[s.type]}
                          </span>
                          <span className="block text-[12px] text-muted-foreground">
                            {SECTION_LABELS[s.type]}
                            {sectionSummary(s) && ` · ${sectionSummary(s)}`}
                          </span>
                        </span>
                      </button>
                      {s.lga && <Badge tone="gold">{s.lga}</Badge>}
                      {s.tab && <Badge>{`Tab: ${s.tab}`}</Badge>}
                      <Mover
                        i={i}
                        n={page.sections.length}
                        label="section"
                        move={(a, d) => {
                          setOpen(new Set());
                          set("sections", reorder(page.sections, a, d));
                        }}
                        remove={(a) => {
                          setOpen(new Set());
                          set(
                            "sections",
                            page.sections.filter((_, j) => j !== a),
                          );
                        }}
                      />
                    </div>
                    {isOpen && (
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                          {s.type !== "topic" && s.type !== "areas" && s.type !== "subpages" && (
                            <LgaSelect
                              value={s.lga ?? ""}
                              onChange={(lga) => setSection(i, { ...s, lga })}
                            />
                          )}
                          <label className="flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
                            Tab
                            <input
                              className={`${inputCls} !min-h-9 !w-48 !py-1 text-[13px]`}
                              list="page-tab-names"
                              placeholder="None"
                              value={s.tab ?? ""}
                              onChange={(e) => setSection(i, { ...s, tab: e.target.value })}
                            />
                          </label>
                        </div>
                        <SectionFields s={s} onChange={(next) => setSection(i, next)} />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select
                className={`${inputCls} sm:max-w-sm`}
                value={adding}
                onChange={(e) => setAdding(e.target.value as PageSection["type"])}
              >
                {(Object.keys(SECTION_LABELS) as PageSection["type"][]).map((t) => (
                  <option key={t} value={t}>
                    {SECTION_LABELS[t]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={abtn.outline}
                onClick={() => {
                  const lga =
                    filter !== "*" && adding !== "topic" && adding !== "areas" ? filter : "";
                  setOpen(new Set([page.sections.length]));
                  set("sections", [...page.sections, { ...blankSection(adding), lga }]);
                }}
              >
                <Plus className="size-4" /> Add section
                {filter !== "*" && filter ? ` to ${filter}` : ""}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <MenuPlacementCard
            rows={menuRows}
            slug={savedSlug}
            title={page.title}
            value={placement}
            onChange={(v) => {
              setDirty(true);
              setPlacement(v);
            }}
          />
          <Card>
            <Field label="Web address" hint={`yunusakintunde.com/${page.slug || "…"}`}>
              <input
                className={inputCls}
                value={page.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value) || e.target.value.toLowerCase());
                }}
              />
            </Field>
            <Field
              label="Search engine description"
              hint="One or two sentences shown on Google and when shared."
            >
              <textarea
                rows={3}
                className={inputCls}
                value={page.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
              />
            </Field>
          </Card>
        </div>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label="Page preview"
        >
          <div className="flex items-center justify-between bg-primary-deep px-4 py-3 text-on-dark">
            <span className="text-sm font-bold">Preview (unsaved changes included)</span>
            <button type="button" className={abtn.outline} onClick={() => setPreview(null)}>
              <X className="size-4" /> Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-background">
            <PageView page={asSitePage(page)} data={preview} />
          </div>
        </div>
      )}
    </>
  );
}

function MenuPlacementCard({
  rows,
  slug,
  title,
  value,
  onChange,
}: {
  rows: MenuRow[] | null;
  slug: string | null;
  title: string;
  value: Placement;
  onChange: (v: Placement) => void;
}) {
  if (!rows) return null;
  const groups = groupOptions(rows, slug);
  const sibs = value.parent === NOT_IN_MENU ? [] : siblingsOf(rows, value.parent, slug);
  return (
    <Card>
      <h3 className="mb-1 text-[14px] font-bold">Top menu</h3>
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Saved with the page. A draft's menu link shows “coming soon” until you publish.
      </p>
      <Field label="Show in the top menu">
        <select
          className={inputCls}
          value={value.parent}
          onChange={(e) =>
            onChange({
              ...value,
              parent: e.target.value,
              before: AT_END,
              label: value.label || title,
            })
          }
        >
          <option value={NOT_IN_MENU}>Not in the menu</option>
          <option value={TOP_LEVEL}>On the main bar (top level)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              Under {g.label}
            </option>
          ))}
        </select>
      </Field>
      {value.parent !== NOT_IN_MENU && (
        <>
          <Field label="Menu text" hint="Leave empty to use the page title.">
            <input
              className={inputCls}
              value={value.label}
              placeholder={title}
              onChange={(e) => onChange({ ...value, label: e.target.value })}
            />
          </Field>
          <Field label="Position">
            <select
              className={inputCls}
              value={value.before}
              onChange={(e) => onChange({ ...value, before: e.target.value })}
            >
              {sibs.map((r) => (
                <option key={r.id} value={r.id}>
                  Before “{r.label}”
                </option>
              ))}
              <option value={AT_END}>At the end</option>
            </select>
          </Field>
        </>
      )}
    </Card>
  );
}

function asSitePage(p: Page): SitePage {
  return {
    slug: p.slug,
    title: p.title || "Untitled page",
    eyebrow: p.eyebrow,
    intro: p.intro,
    heroImage: p.hero_image,
    heroAlt: p.hero_alt,
    seoDescription: p.seo_description,
    sections: normalizeSections(p.sections),
  };
}
