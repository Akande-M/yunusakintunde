import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { lgaSlug, ZONES } from "@/lib/lgas";
import { normalizeSections, type PageSection } from "@/lib/pages";
import { uploadMedia } from "@/components/admin/upload";
import { abtn, Card, errMsg, Field, inputCls, PageTitle, Spinner } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/photos")({
  validateSearch: (s: Record<string, unknown>): { page?: string } =>
    typeof s["page"] === "string" ? { page: s["page"] } : {},
  component: AddPhotos,
});

type PageRow = { id: string; slug: string; title: string; status: string; sections: unknown };
type Picked = { file: File; preview: string; caption: string };
const NEW = "__new__";

/**
 * The quick way to put photos on the website: pick a page, a local government (optional) and a
 * photo section, drop the photos in, type captions, save. Everything else stays in Pages.
 */
function AddPhotos() {
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const search = Route.useSearch();
  const [pageId, setPageId] = useState(search.page ?? "");
  const [lga, setLga] = useState("");
  const [target, setTarget] = useState(NEW);
  const [heading, setHeading] = useState("");
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<{ n: number; href: string } | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    void db
      .from("site_pages")
      .select("id,slug,title,status,sections")
      .order("title")
      .then(({ data, error }) => {
        if (error) setError(errMsg(error));
        setPages((data ?? []) as PageRow[]);
      });
  }, []);

  const page = pages?.find((p) => p.id === pageId);
  const sections = useMemo(() => (page ? normalizeSections(page.sections) : []), [page]);
  // Photo sections already on this page for the chosen local government.
  const galleries = sections
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.type === "gallery" && (s.lga ?? "") === lga);

  useEffect(() => {
    setTarget(galleries[0] ? String(galleries[0].i) : NEW);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, lga]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...list]
      .filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name))
      .map((file) => ({ file, preview: URL.createObjectURL(file), caption: "" }));
    setPhotos((p) => [...p, ...next]);
    setDone(null);
  }

  async function save() {
    if (!page) return setError("Choose a page first.");
    if (!photos.length) return setError("Add at least one photo.");
    if (target === NEW && !heading.trim())
      return setError("Give the new photo section a heading, e.g. “Borehole commissioning”.");
    setError("");
    setDone(null);
    try {
      const uploaded: { url: string; caption: string }[] = [];
      for (const [k, p] of photos.entries()) {
        setBusy(`Uploading photo ${k + 1} of ${photos.length}…`);
        uploaded.push({ url: await uploadMedia(p.file, "pages"), caption: p.caption.trim() });
      }
      setBusy("Adding them to the page…");
      // Read the page again so nobody else's recent edits are overwritten.
      const fresh = await db.from("site_pages").select("sections").eq("id", page.id).single();
      if (fresh.error) throw fresh.error;
      const secs = normalizeSections((fresh.data as { sections: unknown }).sections);
      const old = target === NEW ? null : sections[Number(target)];
      const at =
        old && old.type === "gallery"
          ? secs.findIndex(
              (s) => s.type === "gallery" && s.heading === old.heading && (s.lga ?? "") === lga,
            )
          : -1;
      let next: PageSection[];
      if (at >= 0) {
        next = secs.map((s, i) =>
          i === at && s.type === "gallery" ? { ...s, images: [...s.images, ...uploaded] } : s,
        );
      } else {
        const add: PageSection = {
          type: "gallery",
          heading: heading.trim() || (old && "heading" in old ? old.heading : ""),
          images: uploaded,
          lga,
        };
        // Whole-district photos go before the local-government tabs; tab photos go with their tab.
        const firstTab = secs.findIndex(
          (s) => s.lga || s.type === "topic" || s.type === "areas" || s.type === "projects",
        );
        next =
          !lga && firstTab >= 0
            ? [...secs.slice(0, firstTab), add, ...secs.slice(firstTab)]
            : [...secs, add];
      }
      const res = await db.from("site_pages").update({ sections: next }).eq("id", page.id);
      if (res.error) throw res.error;
      setPages((ps) => ps?.map((p) => (p.id === page.id ? { ...p, sections: next } : p)) ?? ps);
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
      setHeading("");
      setDone({ n: uploaded.length, href: `/${page.slug}${lga ? `#lga-${lgaSlug(lga)}` : ""}` });
    } catch (e) {
      setError(errMsg(e as { message?: string }));
    } finally {
      setBusy(null);
    }
  }

  if (!pages) return <Spinner />;

  return (
    <>
      <PageTitle
        title="Add photos"
        sub="Put photos on any page in three steps. They go live as soon as you press Save."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 text-[15px] font-bold">1. Where should the photos go?</h2>
            <Field label="Page">
              <select
                className={inputCls}
                value={pageId}
                onChange={(e) => {
                  setPageId(e.target.value);
                  setDone(null);
                }}
              >
                <option value="">Choose a page…</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.status !== "published" ? " (draft)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            {page && (
              <>
                <Field
                  label="Local government"
                  hint="Pick one to show the photos under that local government's tab."
                >
                  <select className={inputCls} value={lga} onChange={(e) => setLga(e.target.value)}>
                    <option value="">Whole district (not in a tab)</option>
                    {ZONES.map((z) => (
                      <optgroup key={z.zone} label={`${z.zone} zone`}>
                        {z.lgas.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>
                <Field label="Photo section">
                  <select
                    className={inputCls}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    {galleries.map(({ s, i }) => (
                      <option key={i} value={String(i)}>
                        Add to “{"heading" in s && s.heading ? s.heading : "Photos"}” (
                        {s.type === "gallery" ? s.images.length : 0} photos)
                      </option>
                    ))}
                    <option value={NEW}>Start a new photo section</option>
                  </select>
                </Field>
                {target === NEW && (
                  <Field
                    label="Heading for the new section"
                    hint="e.g. “Borehole commissioning, Awe”"
                  >
                    <input
                      className={inputCls}
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                    />
                  </Field>
                )}
              </>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-[15px] font-bold">2. Add the photos</h2>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`grid place-items-center rounded-sm border-2 border-dashed px-4 py-10 text-center transition-colors ${
                drag ? "border-primary bg-primary-tint" : "border-border bg-paper-2"
              }`}
            >
              <ImagePlus className="mb-2 size-8 text-primary" aria-hidden />
              <p className="text-[14px] font-semibold">Drag photos here</p>
              <p className="mb-3 text-[12.5px] text-muted-foreground">
                or choose them from your computer or phone. Several at once is fine.
              </p>
              <button type="button" className={abtn.outline} onClick={() => input.current?.click()}>
                <Upload className="size-4" /> Choose photos
              </button>
              <input
                ref={input}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {photos.length > 0 && (
              <>
                <h3 className="mt-5 mb-2 text-[13px] font-bold">
                  3. Write a short caption under each photo
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {photos.map((p, i) => (
                    <li key={p.preview} className="rounded-sm border border-border bg-card p-2">
                      <img
                        src={p.preview}
                        alt=""
                        className="aspect-[4/3] w-full rounded-sm bg-paper-2 object-cover"
                      />
                      <div className="mt-2 flex gap-2">
                        <input
                          className={inputCls}
                          placeholder="Caption, e.g. Solar borehole at Ilora"
                          value={p.caption}
                          onChange={(e) =>
                            setPhotos((ps) =>
                              ps.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)),
                            )
                          }
                        />
                        <button
                          type="button"
                          className={abtn.icon}
                          aria-label="Remove this photo"
                          onClick={() => {
                            URL.revokeObjectURL(p.preview);
                            setPhotos((ps) => ps.filter((_, j) => j !== i));
                          }}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          {error && (
            <p
              role="alert"
              className="rounded-sm bg-destructive/5 px-4 py-3 text-[14px] font-semibold text-destructive"
            >
              {error}
            </p>
          )}
          {done && (
            <p
              role="status"
              className="flex flex-wrap items-center gap-2 rounded-sm bg-primary-tint px-4 py-3 text-[14px] font-semibold text-primary"
            >
              <CheckCircle2 className="size-4" /> Done. {done.n} photo{done.n > 1 ? "s are" : " is"}{" "}
              live.
              <a
                href={done.href}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                See it on the website →
              </a>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={abtn.primary}
              disabled={!!busy || !page || !photos.length}
              onClick={() => void save()}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {busy ?? `Save ${photos.length || ""} photo${photos.length === 1 ? "" : "s"}`}
            </button>
            {page && (
              <Link to="/admin/pages/$id" params={{ id: page.id }} className={abtn.outline}>
                Edit the whole page instead
              </Link>
            )}
          </div>
        </div>

        <Card className="h-fit">
          <h3 className="mb-2 text-[14px] font-bold">Tips</h3>
          <ul className="space-y-2 text-[13px] text-muted-foreground">
            <li>Photos from phones are fine; they're resized automatically.</li>
            <li>Captions describe what's in the photo. Don't name people unless you're sure.</li>
            <li>
              To change the order, crop shape or remove photos later, open the page in{" "}
              <Link to="/admin/pages" className="font-semibold text-primary">
                Pages
              </Link>
              .
            </li>
            {page && (
              <li>
                <a
                  href={`/${page.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary"
                >
                  <ExternalLink className="size-3.5" /> Open {page.title}
                </a>
              </li>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
