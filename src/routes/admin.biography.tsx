import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS, mergeSettings, type BiographySettings } from "@/lib/cms-defaults";
import {
  abtn,
  Card,
  errMsg,
  Field,
  ImageField,
  inputCls,
  PageTitle,
  Spinner,
} from "@/components/admin/kit";

export const Route = createFileRoute("/admin/biography")({
  component: BiographyAdmin,
});

type Photos = { bioTop: string; bioSecond: string };

function move<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

function RowTools({
  i,
  n,
  onMove,
  onRemove,
}: {
  i: number;
  n: number;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        className={abtn.icon}
        disabled={i === 0}
        onClick={() => onMove(-1)}
        aria-label="Move up"
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        className={abtn.icon}
        disabled={i === n - 1}
        onClick={() => onMove(1)}
        aria-label="Move down"
      >
        <ArrowDown className="size-4" />
      </button>
      <button type="button" className={abtn.icon} onClick={onRemove} aria-label="Remove">
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function BiographyAdmin() {
  const [bio, setBio] = useState<BiographySettings | null>(null);
  const [photos, setPhotos] = useState<Photos | null>(null);
  const [imagesRow, setImagesRow] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void db
      .from("site_settings")
      .select("key,value")
      .then(({ data, error }) => {
        if (error) toast.error(errMsg(error));
        const rows = (data ?? []) as { key: string; value: unknown }[];
        const merged = mergeSettings(rows);
        setBio(structuredClone(merged.biography));
        setPhotos({ bioTop: merged.images.bioTop, bioSecond: merged.images.bioSecond });
        setImagesRow(
          ((rows.find((r) => r.key === "images")?.value ?? {}) as Record<string, string>) || {},
        );
      });
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!bio || !photos) return <Spinner />;

  const update = (next: Partial<BiographySettings>) => {
    setDirty(true);
    setBio({ ...bio, ...next });
  };
  const setPhoto = (k: keyof Photos, v: string) => {
    setDirty(true);
    setPhotos({ ...photos, [k]: v });
  };

  async function save() {
    if (!bio || !photos) return;
    setSaving(true);
    const clean: BiographySettings = {
      ...bio,
      facts: bio.facts.filter((f) => f.n.trim() || f.l.trim()),
      sections: bio.sections.filter((s) => s.heading.trim() || s.body.trim()),
      timeline: bio.timeline.filter((t) => t.year.trim() || t.title.trim()),
    };
    const nextImages = { ...imagesRow, bioTop: photos.bioTop, bioSecond: photos.bioSecond };
    const [a, b] = await Promise.all([
      db.from("site_settings").upsert({ key: "biography", value: clean }, { onConflict: "key" }),
      db.from("site_settings").upsert({ key: "images", value: nextImages }, { onConflict: "key" }),
    ]);
    setSaving(false);
    const err = a.error ?? b.error;
    if (err) {
      toast.error(errMsg(err));
      return;
    }
    setImagesRow(nextImages);
    setBio(clean);
    setDirty(false);
    toast.success("Biography saved. It's live on the site.");
  }

  return (
    <>
      <Link
        to="/admin/pages"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> All pages
      </Link>
      <PageTitle
        title="Biography"
        sub="Everything on the Biography page: the introduction, key facts, the story, the photos and the timeline."
        action={
          <div className="flex flex-wrap gap-2">
            <a href="/biography" target="_blank" rel="noreferrer" className={abtn.outline}>
              <ExternalLink className="size-4" /> View page
            </a>
            <button
              type="button"
              className={abtn.primary}
              disabled={!dirty || saving}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        }
      />

      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-serif text-[18px] font-semibold">Top of the page</h2>
            <Field label="Small label above the title">
              <input
                className={inputCls}
                value={bio.eyebrow}
                onChange={(e) => update({ eyebrow: e.target.value })}
              />
            </Field>
            <Field label="Title">
              <input
                className={inputCls}
                value={bio.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </Field>
            <Field label="Introduction">
              <textarea
                rows={4}
                className={inputCls}
                value={bio.intro}
                onChange={(e) => update({ intro: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={bio.showApcBadge}
                onChange={(e) => update({ showApcBadge: e.target.checked })}
              />
              Show the APC badge under the introduction
            </label>
          </Card>
          <Card>
            <h2 className="mb-4 font-serif text-[18px] font-semibold">Photos</h2>
            <Field label="Main photo (beside the introduction)">
              <ImageField
                value={photos.bioTop}
                onChange={(v) => setPhoto("bioTop", v || DEFAULT_SETTINGS.images.bioTop)}
                folder="site"
              />
            </Field>
            <Field label="Second photo (under the story)">
              <ImageField
                value={photos.bioSecond}
                onChange={(v) => setPhoto("bioSecond", v || DEFAULT_SETTINGS.images.bioSecond)}
                folder="site"
              />
            </Field>
            <Field label="Second photo caption">
              <input
                className={inputCls}
                value={bio.photoCaption}
                onChange={(e) => update({ photoCaption: e.target.value })}
              />
            </Field>
          </Card>
        </div>

        <Card>
          <h2 className="mb-1 font-serif text-[18px] font-semibold">Key facts</h2>
          <p className="mb-4 text-[13px] text-muted-foreground">
            The row of short facts under the introduction. Four fit best.
          </p>
          <div className="space-y-3">
            {bio.facts.map((f, i) => (
              <div key={i} className="grid items-end gap-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                <Field label="Big text">
                  <input
                    className={inputCls}
                    value={f.n}
                    onChange={(e) =>
                      update({
                        facts: bio.facts.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)),
                      })
                    }
                  />
                </Field>
                <Field label="Small text">
                  <input
                    className={inputCls}
                    value={f.l}
                    onChange={(e) =>
                      update({
                        facts: bio.facts.map((x, j) => (j === i ? { ...x, l: e.target.value } : x)),
                      })
                    }
                  />
                </Field>
                <div className="mb-4">
                  <RowTools
                    i={i}
                    n={bio.facts.length}
                    onMove={(d) => update({ facts: move(bio.facts, i, d) })}
                    onRemove={() => update({ facts: bio.facts.filter((_, j) => j !== i) })}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={abtn.outline}
            onClick={() => update({ facts: [...bio.facts, { n: "", l: "" }] })}
          >
            <Plus className="size-4" /> Add fact
          </button>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="mb-1 font-serif text-[18px] font-semibold">The story</h2>
            <p className="mb-4 text-[13px] text-muted-foreground">
              Leave an empty line between paragraphs.
            </p>
            <div className="space-y-4">
              {bio.sections.map((sec, i) => (
                <div key={i} className="rounded-sm border border-border bg-paper-2 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[13px] font-bold">Part {i + 1}</span>
                    <RowTools
                      i={i}
                      n={bio.sections.length}
                      onMove={(d) => update({ sections: move(bio.sections, i, d) })}
                      onRemove={() => update({ sections: bio.sections.filter((_, j) => j !== i) })}
                    />
                  </div>
                  <Field label="Heading">
                    <input
                      className={inputCls}
                      value={sec.heading}
                      onChange={(e) =>
                        update({
                          sections: bio.sections.map((x, j) =>
                            j === i ? { ...x, heading: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Text">
                    <textarea
                      rows={8}
                      className={inputCls}
                      value={sec.body}
                      onChange={(e) =>
                        update({
                          sections: bio.sections.map((x, j) =>
                            j === i ? { ...x, body: e.target.value } : x,
                          ),
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
              onClick={() => update({ sections: [...bio.sections, { heading: "", body: "" }] })}
            >
              <Plus className="size-4" /> Add part
            </button>
          </Card>

          <Card>
            <h2 className="mb-4 font-serif text-[18px] font-semibold">Timeline</h2>
            <Field label="Timeline heading">
              <input
                className={inputCls}
                value={bio.timelineHeading}
                onChange={(e) => update({ timelineHeading: e.target.value })}
              />
            </Field>
            <div className="space-y-3">
              {bio.timeline.map((t, i) => {
                const setT = (patch: Partial<typeof t>) =>
                  update({
                    timeline: bio.timeline.map((x, j) => (j === i ? { ...x, ...patch } : x)),
                  });
                return (
                  <div key={i} className="rounded-sm border border-border bg-paper-2 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[13px] font-bold">Entry {i + 1}</span>
                      <RowTools
                        i={i}
                        n={bio.timeline.length}
                        onMove={(d) => update({ timeline: move(bio.timeline, i, d) })}
                        onRemove={() =>
                          update({ timeline: bio.timeline.filter((_, j) => j !== i) })
                        }
                      />
                    </div>
                    <Field label="Years">
                      <input
                        className={inputCls}
                        value={t.year}
                        onChange={(e) => setT({ year: e.target.value })}
                      />
                    </Field>
                    <Field label="Role">
                      <input
                        className={inputCls}
                        value={t.title}
                        onChange={(e) => setT({ title: e.target.value })}
                      />
                    </Field>
                    <Field label="Note (optional)">
                      <input
                        className={inputCls}
                        value={t.note}
                        onChange={(e) => setT({ note: e.target.value })}
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={t.current}
                        onChange={(e) => setT({ current: e.target.checked })}
                      />
                      Current role (highlighted in gold)
                    </label>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className={`${abtn.outline} mt-3`}
              onClick={() =>
                update({
                  timeline: [...bio.timeline, { year: "", title: "", note: "", current: false }],
                })
              }
            >
              <Plus className="size-4" /> Add entry
            </button>
          </Card>
        </div>
      </div>

      {dirty && (
        <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-3 rounded-sm border border-accent bg-card px-4 py-3 shadow-lg">
          <span className="text-sm font-semibold">You have unsaved changes.</span>
          <button
            type="button"
            className={abtn.primary}
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </>
  );
}
