import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { toParagraphs } from "@/lib/cms";
import { NEWS_FILTERS } from "@/lib/site-data";
import { uploadMedia } from "@/components/admin/upload";
import {
  abtn,
  Badge,
  Card,
  errMsg,
  Field,
  ImageField,
  inputCls,
  Spinner,
} from "@/components/admin/kit";

export const Route = createFileRoute("/admin/news/$id")({
  component: NewsEditor,
});

type Photo = { url: string; alt: string; caption: string };
type Post = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  body: string;
  hero_image_url: string | null;
  hero_alt: string;
  photos: Photo[];
  status: "draft" | "published";
  published_at: string;
};

const CATEGORIES = NEWS_FILTERS.filter((c) => c !== "All");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");

const toLocalInput = (iso: string) => format(new Date(iso), "yyyy-MM-dd'T'HH:mm");

function blank(): Post {
  return {
    slug: "",
    title: "",
    summary: "",
    category: "Constituency",
    body: "",
    hero_image_url: null,
    hero_alt: "",
    photos: [],
    status: "draft",
    published_at: new Date().toISOString(),
  };
}

function NewsEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(isNew ? blank() : null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    void db
      .from("news_posts")
      .select(
        "id,slug,title,summary,category,body,hero_image_url,hero_alt,photos,status,published_at",
      )
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error(error ? errMsg(error) : "Story not found");
          void navigate({ to: "/admin/news" });
          return;
        }
        setPost({
          ...(data as Post),
          photos: Array.isArray(data.photos) ? (data.photos as Photo[]) : [],
        });
      });
  }, [id, isNew, navigate]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!post) return <Spinner />;

  const set = <K extends keyof Post>(k: K, v: Post[K]) => {
    setDirty(true);
    setPost((p) => {
      if (!p) return p;
      const next = { ...p, [k]: v };
      if (k === "title" && !slugTouched) next.slug = slugify(String(v));
      return next;
    });
  };

  const setPhoto = (i: number, patch: Partial<Photo>) =>
    set(
      "photos",
      post.photos.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    );
  const movePhoto = (i: number, d: -1 | 1) => {
    const list = [...post.photos];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
    set("photos", list);
  };

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const added: Photo[] = [];
    for (const f of Array.from(files)) {
      try {
        added.push({ url: await uploadMedia(f, "news"), alt: "", caption: "" });
      } catch (e) {
        toast.error(`${f.name}: ${errMsg(e)}`);
      }
    }
    setUploading(false);
    if (photoInput.current) photoInput.current.value = "";
    if (added.length) set("photos", [...(post?.photos ?? []), ...added]);
  }

  async function save(status: Post["status"]) {
    if (!post) return;
    const p = { ...post, status, slug: post.slug.replace(/^-+|-+$/g, "") || slugify(post.title) };
    if (!p.title.trim()) {
      toast.error("Add a headline first.");
      return;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) {
      toast.error("The web address can only use lowercase letters, numbers and dashes.");
      return;
    }
    if (status === "published") {
      if (!p.summary.trim()) {
        toast.error("Add a short summary — it shows on the news card.");
        return;
      }
      if (!p.hero_image_url) {
        toast.error("Add a main photo before publishing.");
        return;
      }
    }
    setSaving(true);
    const payload = {
      slug: p.slug,
      title: p.title.trim(),
      summary: p.summary.trim(),
      category: p.category,
      body: p.body.trim(),
      hero_image_url: p.hero_image_url || null,
      hero_alt: p.hero_alt.trim(),
      photos: p.photos.filter((x) => x.url),
      status,
      published_at: p.published_at,
    };
    const res = p.id
      ? await db.from("news_posts").update(payload).eq("id", p.id).select("id").single()
      : await db.from("news_posts").insert(payload).select("id").single();
    setSaving(false);
    if (res.error) {
      toast.error(errMsg(res.error));
      return;
    }
    setDirty(false);
    const future = new Date(p.published_at) > new Date();
    toast.success(
      status === "draft"
        ? "Saved as draft (not on the website)"
        : future
          ? `Scheduled — goes live ${format(new Date(p.published_at), "d MMM, HH:mm")}`
          : "Published — it's live now",
    );
    if (!p.id) {
      void navigate({
        to: "/admin/news/$id",
        params: { id: res.data.id as string },
        replace: true,
      });
    } else {
      setPost({ ...p, status });
    }
  }

  const live = post.status === "published";
  const paragraphs = toParagraphs(post.body).length;

  return (
    <>
      <Link
        to="/admin/news"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary"
      >
        <ArrowLeft className="size-4" /> All stories
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-[24px] font-semibold text-primary-deep">
          {isNew ? "New story" : "Edit story"}
        </h1>
        {live ? <Badge tone="green">Live</Badge> : <Badge>Draft</Badge>}
        {dirty && <Badge tone="gold">Unsaved changes</Badge>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <Card className="mb-5">
            <Field label="Headline *">
              <input
                className={`${inputCls} text-[16px] font-semibold`}
                value={post.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field
              label="Summary *"
              hint={`Shown on the news card and in WhatsApp/Facebook link previews. ${post.summary.length}/200`}
            >
              <textarea
                className={inputCls}
                rows={2}
                maxLength={300}
                value={post.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            </Field>
            <Field
              label="Full story"
              hint={`Leave an empty line between paragraphs. ${paragraphs} paragraph${paragraphs === 1 ? "" : "s"}. If empty, the card shows “Full story coming soon”.`}
            >
              <textarea
                className={`${inputCls} font-serif text-[15.5px] leading-relaxed`}
                rows={16}
                value={post.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder={"First paragraph…\n\nSecond paragraph…"}
              />
            </Field>
          </Card>

          <Card className="mb-5">
            <h2 className="mb-3 text-[15px] font-bold">Main photo *</h2>
            <ImageField
              value={post.hero_image_url}
              onChange={(url) => set("hero_image_url", url || null)}
              folder="news"
            />
            <div className="mt-3">
              <Field
                label="Describe the photo"
                hint="For visually impaired readers and Google, e.g. “Senator Akintunde addressing residents in Ogbomoso”."
              >
                <input
                  className={inputCls}
                  value={post.hero_alt}
                  onChange={(e) => set("hero_alt", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-bold">Photos from the event</h2>
              <button
                type="button"
                className={abtn.outline}
                disabled={uploading}
                onClick={() => photoInput.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}{" "}
                Add photos
              </button>
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => void addPhotos(e.target.files)}
              />
            </div>
            {post.photos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Optional. You can select several photos at once.
              </p>
            )}
            <ul className="space-y-3">
              {post.photos.map((ph, i) => (
                <li key={ph.url + i} className="flex gap-3 rounded-sm border border-border p-3">
                  <img src={ph.url} alt="" className="size-20 shrink-0 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      className={inputCls}
                      placeholder="Caption (shown under the photo)"
                      value={ph.caption}
                      onChange={(e) => setPhoto(i, { caption: e.target.value })}
                    />
                    <input
                      className={inputCls}
                      placeholder="Describe the photo"
                      value={ph.alt}
                      onChange={(e) => setPhoto(i, { alt: e.target.value })}
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      className={abtn.icon}
                      disabled={i === 0}
                      onClick={() => movePhoto(i, -1)}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      className={abtn.icon}
                      disabled={i === post.photos.length - 1}
                      onClick={() => movePhoto(i, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      className={abtn.icon}
                      onClick={() =>
                        set(
                          "photos",
                          post.photos.filter((_, j) => j !== i),
                        )
                      }
                      aria-label="Remove photo"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <div className="flex flex-col gap-2">
              {live ? (
                <>
                  <button
                    className={abtn.primary}
                    disabled={saving}
                    onClick={() => void save("published")}
                  >
                    {saving && <Loader2 className="size-4 animate-spin" />} Update live story
                  </button>
                  <button
                    className={abtn.outline}
                    disabled={saving}
                    onClick={() => void save("draft")}
                  >
                    Unpublish (back to draft)
                  </button>
                  {post.body.trim() && !isNew && (
                    <a
                      className={abtn.outline}
                      href={`/news/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="size-4" /> View on site
                    </a>
                  )}
                </>
              ) : (
                <>
                  <button
                    className={abtn.gold}
                    disabled={saving}
                    onClick={() => void save("published")}
                  >
                    {saving && <Loader2 className="size-4 animate-spin" />} Publish
                  </button>
                  <button
                    className={abtn.outline}
                    disabled={saving}
                    onClick={() => void save("draft")}
                  >
                    Save draft
                  </button>
                </>
              )}
            </div>
          </Card>
          <Card>
            <Field label="Category">
              <select
                className={inputCls}
                value={post.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Date shown on the story" hint="Set a future time to schedule it.">
              <input
                className={inputCls}
                type="datetime-local"
                value={toLocalInput(post.published_at)}
                onChange={(e) =>
                  e.target.value && set("published_at", new Date(e.target.value).toISOString())
                }
              />
            </Field>
            <Field
              label="Web address"
              hint={
                live && !isNew
                  ? "Changing this breaks links already shared on WhatsApp/social media."
                  : `/news/${post.slug || "…"}`
              }
            >
              <input
                className={inputCls}
                value={post.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set(
                    "slug",
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-")
                      .replace(/-{2,}/g, "-"),
                  );
                }}
              />
            </Field>
          </Card>
        </aside>
      </div>
    </>
  );
}
