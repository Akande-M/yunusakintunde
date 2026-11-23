import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Pencil,
  Video,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { GALLERY_FILTERS } from "@/lib/site-data";
import { youtubeId, youtubeThumb } from "@/lib/cms";
import { MAX_VIDEO_MB, uploadMedia } from "@/components/admin/upload";
import {
  abtn,
  Badge,
  ConfirmButton,
  EditDialog,
  errMsg,
  Field,
  FieldsForm,
  inputCls,
  PageTitle,
  Spinner,
  type FieldDef,
} from "@/components/admin/kit";
import { siteUrl } from "@/lib/asset-url";
import { PageHeadingCard } from "@/components/admin/PageHeadingCard";

export const Route = createFileRoute("/admin/media")({
  component: MediaAdmin,
});

type Item = {
  id: string;
  kind: "image" | "youtube" | "video";
  url: string;
  thumbnail_url: string | null;
  alt: string;
  caption: string;
  category: string;
  archived: boolean;
  published: boolean;
  sort_order: number;
};

const CATEGORIES = GALLERY_FILTERS.filter((c) => c !== "All");
const catOptions = CATEGORIES.map((c) => ({ value: c, label: c }));

const FIELDS: FieldDef[] = [
  {
    name: "caption",
    label: "Caption",
    type: "text",
    hint: "Shown under the photo, e.g. “Ward rally, Ogbomoso”.",
  },
  {
    name: "alt",
    label: "Describe the image",
    type: "text",
    hint: "For visually impaired visitors and Google.",
  },
  { name: "category", label: "Category", type: "select", options: catOptions },
  {
    name: "archived",
    label: "Mark as archived",
    type: "toggle",
    hint: "Adds an “Archived” tag (for 2023 material).",
  },
  { name: "published", label: "Show on website", type: "toggle" },
];

function thumbOf(i: Item) {
  if (i.kind === "youtube") return siteUrl(i.thumbnail_url) || youtubeThumb(i.url) || "";
  if (i.kind === "video") return siteUrl(i.thumbnail_url) || "";
  return siteUrl(i.url);
}

function MediaAdmin() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [uploadCat, setUploadCat] = useState<string>("In Office");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [ytOpen, setYtOpen] = useState(false);
  const [yt, setYt] = useState({ url: "", caption: "" });
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("gallery_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(errMsg(error));
    setItems((data as Item[]) ?? []);
  }, []);
  useEffect(() => void load(), [load]);

  const topOrder = () => Math.min(0, ...(items ?? []).map((i) => i.sort_order)) - 10;

  async function insert(rows: Partial<Item>[]) {
    let order = topOrder();
    const payload = rows.map((r) => ({
      ...r,
      category: r.category ?? uploadCat,
      sort_order: (order -= 1),
    }));
    const { error } = await db.from("gallery_items").insert(payload);
    if (error) throw error;
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    setBusy(`Uploading ${files.length} photo${files.length > 1 ? "s" : ""}…`);
    const rows: Partial<Item>[] = [];
    for (const f of Array.from(files)) {
      try {
        rows.push({ kind: "image", url: await uploadMedia(f, "gallery"), caption: "", alt: "" });
      } catch (e) {
        toast.error(`${f.name}: ${errMsg(e)}`);
      }
    }
    try {
      if (rows.length) {
        await insert(rows);
        toast.success(
          `${rows.length} photo${rows.length > 1 ? "s" : ""} added. Add captions with the pencil icon`,
        );
      }
    } catch (e) {
      toast.error(errMsg(e));
    }
    setBusy(null);
    if (photoRef.current) photoRef.current.value = "";
    void load();
  }

  async function uploadVideo(file: File | undefined) {
    if (!file) return;
    setBusy("Uploading video… keep this tab open");
    try {
      const url = await uploadMedia(file, "gallery");
      await insert([
        {
          kind: "video",
          url,
          caption: file.name.replace(/\.[^.]+$/, ""),
          alt: "",
          category: "Videos",
        },
      ]);
      toast.success("Video added");
    } catch (e) {
      toast.error(errMsg(e));
    }
    setBusy(null);
    if (videoRef.current) videoRef.current.value = "";
    void load();
  }

  async function addYoutube() {
    if (!youtubeId(yt.url)) {
      toast.error("That doesn't look like a YouTube link.");
      return;
    }
    setSaving(true);
    try {
      await insert([
        {
          kind: "youtube",
          url: yt.url.trim(),
          caption: yt.caption.trim(),
          alt: yt.caption.trim(),
          category: "Videos",
        },
      ]);
      toast.success("YouTube video added");
      setYtOpen(false);
      setYt({ url: "", caption: "" });
      void load();
    } catch (e) {
      toast.error(errMsg(e));
    }
    setSaving(false);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const { id, caption, alt, category, archived, published, thumbnail_url } = editing;
    const { error } = await db
      .from("gallery_items")
      .update({ caption, alt, category, archived, published, thumbnail_url })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Saved");
    setEditing(null);
    void load();
  }

  async function move(item: Item, dir: -1 | 1) {
    if (!items) return;
    const list = items.map((x, i) => ({ ...x, sort_order: i * 10 }));
    const i = list.findIndex((x) => x.id === item.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i]!.sort_order, list[j]!.sort_order] = [list[j]!.sort_order, list[i]!.sort_order];
    setItems([...list].sort((a, b) => a.sort_order - b.sort_order));
    await Promise.all(
      list.map((x) => db.from("gallery_items").update({ sort_order: x.sort_order }).eq("id", x.id)),
    );
  }

  async function toggle(item: Item) {
    const { error } = await db
      .from("gallery_items")
      .update({ published: !item.published })
      .eq("id", item.id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    void load();
  }

  async function remove(item: Item) {
    const { error } = await db.from("gallery_items").delete().eq("id", item.id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Removed from gallery");
    void load();
  }

  const shown = (items ?? []).filter((i) => filter === "All" || i.category === filter);

  return (
    <>
      <PageTitle
        title="Media gallery"
        sub={`Photos and videos on the Media page. New items appear first. Videos: paste a YouTube link (best for anything long), or upload a short clip up to ${MAX_VIDEO_MB} MB.`}
      />
      <PageHeadingCard page="media" label="Media Gallery" />
      <div className="mb-5 flex flex-col gap-3 rounded-sm border border-border bg-card p-4 sm:flex-row sm:items-end">
        <label className="block sm:w-56">
          <span className="mb-1.5 block text-[13px] font-bold">New photos go into</span>
          <select
            className={inputCls}
            value={uploadCat}
            onChange={(e) => setUploadCat(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            className={abtn.primary}
            disabled={!!busy}
            onClick={() => photoRef.current?.click()}
          >
            <ImagePlus className="size-4" /> Upload photos
          </button>
          <button className={abtn.outline} disabled={!!busy} onClick={() => setYtOpen(true)}>
            <Youtube className="size-4" /> Add YouTube video
          </button>
          <button
            className={abtn.outline}
            disabled={!!busy}
            onClick={() => videoRef.current?.click()}
          >
            <Video className="size-4" /> Upload video
          </button>
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => void uploadPhotos(e.target.files)}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          hidden
          onChange={(e) => void uploadVideo(e.target.files?.[0])}
        />
      </div>
      {busy && (
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
          <Loader2 className="size-4 animate-spin" /> {busy}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {GALLERY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-9 rounded-full border px-3.5 text-[12.5px] font-semibold ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {!items ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((it) => {
            const t = thumbOf(it);
            return (
              <li
                key={it.id}
                className={`overflow-hidden rounded-sm border border-border bg-card ${it.published ? "" : "opacity-60"}`}
              >
                <div className="relative aspect-square bg-primary-deep">
                  {t ? (
                    <img src={t} alt="" className="size-full object-cover" loading="lazy" />
                  ) : (
                    <video
                      src={`${siteUrl(it.url)}#t=0.5`}
                      muted
                      preload="metadata"
                      className="size-full object-cover"
                    />
                  )}
                  <span className="absolute top-2 left-2 flex gap-1">
                    {it.kind !== "image" && (
                      <Badge tone="gold">{it.kind === "youtube" ? "YouTube" : "Video"}</Badge>
                    )}
                    {!it.published && <Badge>Hidden</Badge>}
                  </span>
                </div>
                <div className="px-3 pt-2 pb-3">
                  <p className="truncate text-[13px] font-semibold">
                    {it.caption || <span className="text-accent-deep">⚠ No caption</span>}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">{it.category}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      className={abtn.icon}
                      title="Move earlier"
                      aria-label="Move earlier"
                      onClick={() => void move(it, -1)}
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <button
                      className={abtn.icon}
                      title="Move later"
                      aria-label="Move later"
                      onClick={() => void move(it, 1)}
                    >
                      <ArrowRight className="size-4" />
                    </button>
                    <button
                      className={abtn.icon}
                      title={it.published ? "Hide" : "Show"}
                      aria-label={it.published ? "Hide" : "Show"}
                      onClick={() => void toggle(it)}
                    >
                      {it.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button
                      className={abtn.icon}
                      title="Edit"
                      aria-label="Edit"
                      onClick={() => setEditing({ ...it })}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <ConfirmButton
                      label="Delete"
                      title="Delete this item?"
                      description="It will be removed from the Media page."
                      onConfirm={() => remove(it)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <EditDialog
        open={!!editing}
        title="Edit media item"
        onClose={() => setEditing(null)}
        onSave={() => void saveEdit()}
        saving={saving}
      >
        {editing && (
          <>
            <FieldsForm
              fields={FIELDS}
              value={editing as unknown as Record<string, unknown>}
              onChange={(v) => setEditing(v as unknown as Item)}
            />
            {editing.kind === "video" && (
              <Field label="Cover image link (optional)" hint="Shown before the video plays.">
                <input
                  className={inputCls}
                  value={editing.thumbnail_url ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, thumbnail_url: e.target.value || null })
                  }
                />
              </Field>
            )}
          </>
        )}
      </EditDialog>

      <EditDialog
        open={ytOpen}
        title="Add a YouTube video"
        onClose={() => setYtOpen(false)}
        onSave={() => void addYoutube()}
        saving={saving}
      >
        <Field label="YouTube link *" hint="Copy it from the Share button on YouTube.">
          <input
            className={inputCls}
            placeholder="https://youtu.be/…"
            value={yt.url}
            onChange={(e) => setYt({ ...yt, url: e.target.value })}
          />
        </Field>
        {youtubeThumb(yt.url) && (
          <img
            src={youtubeThumb(yt.url)!}
            alt=""
            className="mb-4 aspect-video w-full rounded-sm object-cover"
          />
        )}
        <Field label="Caption">
          <input
            className={inputCls}
            value={yt.caption}
            onChange={(e) => setYt({ ...yt, caption: e.target.value })}
          />
        </Field>
      </EditDialog>
    </>
  );
}
