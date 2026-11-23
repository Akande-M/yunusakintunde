import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { canLoadImage, uploadMedia } from "@/components/admin/upload";
import { normalizeItems, type AchievementItem } from "@/lib/achievements-data";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { siteUrl } from "@/lib/asset-url";

// ------------------------------------------------------------------ styling
const BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-sm text-[13.5px] font-bold transition-colors min-h-10 px-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
export const abtn = {
  primary: `${BTN} bg-primary text-primary-foreground hover:bg-primary-hover`,
  gold: `${BTN} bg-accent text-accent-foreground hover:bg-accent-hover hover:text-primary-foreground`,
  outline: `${BTN} border border-border bg-card text-foreground hover:border-primary hover:text-primary`,
  danger: `${BTN} border border-destructive/40 bg-card text-destructive hover:bg-destructive hover:text-white`,
  icon: "inline-grid size-9 place-items-center rounded-sm border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
};
export const inputCls =
  "w-full rounded-sm border border-border bg-card px-3 py-2.5 text-[14.5px] text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) {
    const m = String((e as { message: unknown }).message);
    if (/duplicate key|23505/.test(m))
      return "That web address (slug) is already used by another item.";
    if (/row-level security|permission denied/i.test(m))
      return "You don't have permission to do that.";
    return m;
  }
  return "Something went wrong. Please try again.";
}

export function PageTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-[26px] font-semibold text-primary-deep">{title}</h1>
        {sub && <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-sm border border-border bg-card p-5 ${className}`}>{children}</div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "green" | "gold" | "neutral" | "red";
  children: ReactNode;
}) {
  const tones = {
    green: "bg-primary-tint text-primary",
    gold: "bg-accent-tint text-accent-deep",
    neutral: "bg-muted text-muted-foreground",
    red: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[11.5px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  warn,
}: {
  label: string;
  hint?: string;
  warn?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[13px] font-bold text-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted-foreground">{hint}</span>}
      {warn && (
        <span className="mt-1 block text-[12px] font-semibold text-accent-deep">⚠ {warn}</span>
      )}
    </label>
  );
}

/** Flags leftover template text so placeholders never go live unnoticed. */
export function placeholderWarning(value: string): string | null {
  if (/\[[^\]]+\]/.test(value)) return "This still contains placeholder text in [brackets].";
  if (/800 000 0000|000 0000/.test(value)) return "This looks like a placeholder phone number.";
  return null;
}

// ------------------------------------------------------------------ confirm
export function ConfirmButton({
  label,
  title,
  description,
  onConfirm,
  className = abtn.icon,
  children,
}: {
  label: string;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children ?? <Trash2 className="size-4" />}
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void onConfirm()}
            >
              {label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ------------------------------------------------------------------ image field
export function ImageField({
  value,
  onChange,
  folder,
  accept = "image/*,.heic,.heif",
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
  folder: "news" | "gallery" | "projects" | "site" | "pages";
  accept?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const isVideo = !!value && /\.(mp4|webm|mov)(\?|$)/i.test(value);

  // Flag links that don't open as an image (e.g. Google Drive or WhatsApp links).
  useEffect(() => {
    let alive = true;
    setBroken(false);
    if (!value || isVideo) return;
    void canLoadImage(siteUrl(value)).then((ok) => alive && setBroken(!ok));
    return () => {
      alive = false;
    };
  }, [value, isVideo]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadMedia(file, folder));
      toast.success("Uploaded. Click Save to put it on the website.");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative grid aspect-[16/10] w-full shrink-0 place-items-center overflow-hidden rounded-sm border border-dashed border-border bg-paper sm:w-56">
        {value && broken ? (
          <span className="px-3 text-center text-[12px] font-semibold text-destructive">
            Image not loading
          </span>
        ) : value ? (
          isVideo ? (
            <video
              src={siteUrl(value)}
              className="size-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <img src={siteUrl(value)} alt="" className="size-full object-cover" />
          )
        ) : (
          <ImagePlus className="size-7 text-muted-foreground" />
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-card/80">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={abtn.outline}
            disabled={busy}
            onClick={() => ref.current?.click()}
          >
            <Upload className="size-4" /> {value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button type="button" className={abtn.outline} onClick={() => onChange("")}>
              <X className="size-4" /> Remove
            </button>
          )}
        </div>
        <input
          className={inputCls}
          placeholder="…or paste an image link"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.trim())}
        />
        {broken && (
          <p role="alert" className="text-[12.5px] font-semibold text-destructive">
            ⚠ This image doesn't load, so visitors won't see it. Upload the photo itself, or paste a
            direct image link (ending in .jpg or .png).
          </p>
        )}
        <input
          ref={ref}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => void pick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ generic form
export type FieldDef =
  | {
      name: string;
      label: string;
      type: "text" | "url";
      hint?: string;
      required?: boolean;
      placeholder?: string;
      checkPlaceholder?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "textarea";
      hint?: string;
      required?: boolean;
      rows?: number;
      checkPlaceholder?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: readonly { value: string; label: string }[];
      hint?: string;
    }
  | { name: string; label: string; type: "toggle"; hint?: string }
  | { name: string; label: string; type: "lines"; hint?: string; rows?: number; required?: boolean }
  | { name: string; label: string; type: "items"; hint?: string; required?: boolean }
  | {
      name: string;
      label: string;
      type: "image";
      folder: "news" | "gallery" | "projects" | "site" | "pages";
      hint?: string;
    };

type Row = Record<string, unknown>;

export function FieldsForm({
  fields,
  value,
  onChange,
}: {
  fields: FieldDef[];
  value: Row;
  onChange: (v: Row) => void;
}) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <>
      {fields.map((f) => {
        const v = value[f.name];
        if (f.type === "toggle") {
          return (
            <label key={f.name} className="mb-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[var(--primary)]"
                checked={Boolean(v)}
                onChange={(e) => set(f.name, e.target.checked)}
              />
              <span>
                <span className="block text-[13px] font-bold">{f.label}</span>
                {f.hint && (
                  <span className="block text-[12px] text-muted-foreground">{f.hint}</span>
                )}
              </span>
            </label>
          );
        }
        if (f.type === "image") {
          return (
            <Field key={f.name} label={f.label} {...(f.hint ? { hint: f.hint } : {})}>
              <ImageField
                value={(v as string) ?? ""}
                onChange={(url) => set(f.name, url || null)}
                folder={f.folder}
              />
            </Field>
          );
        }
        if (f.type === "select") {
          return (
            <Field key={f.name} label={f.label} {...(f.hint ? { hint: f.hint } : {})}>
              <select
                className={inputCls}
                value={String(v ?? "")}
                onChange={(e) => set(f.name, e.target.value)}
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          );
        }
        if (f.type === "items") {
          return (
            <Field
              key={f.name}
              label={`${f.label}${f.required ? " *" : ""}`}
              {...(f.hint ? { hint: f.hint } : {})}
            >
              <ItemsEditor value={normalizeItems(v)} onChange={(next) => set(f.name, next)} />
            </Field>
          );
        }
        if (f.type === "lines") {
          const text = Array.isArray(v) ? v.join("\n") : String(v ?? "");
          const count = text.split("\n").filter((l) => l.trim()).length;
          return (
            <Field
              key={f.name}
              label={`${f.label}${f.required ? " *" : ""} (${count})`}
              hint={f.hint ?? "One item per line."}
              warn={placeholderWarning(text)}
            >
              <textarea
                className={inputCls}
                rows={f.rows ?? 8}
                value={text}
                onChange={(e) => set(f.name, e.target.value)}
              />
            </Field>
          );
        }
        const str = String(v ?? "");
        const warn = f.checkPlaceholder ? placeholderWarning(str) : null;
        return (
          <Field
            key={f.name}
            label={f.label + (f.required ? " *" : "")}
            {...(f.hint ? { hint: f.hint } : {})}
            warn={warn}
          >
            {f.type === "textarea" ? (
              <textarea
                className={inputCls}
                rows={f.rows ?? 3}
                value={str}
                onChange={(e) => set(f.name, e.target.value)}
              />
            ) : (
              <input
                className={inputCls}
                type={f.type === "url" ? "url" : "text"}
                value={str}
                placeholder={"placeholder" in f ? f.placeholder : undefined}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
          </Field>
        );
      })}
    </>
  );
}

export function EditDialog({
  open,
  title,
  onClose,
  children,
  onSave,
  saving,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="font-serif text-xl">{title}</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="mt-2">{children}</div>
          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" className={abtn.outline} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={abtn.primary} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ ordered collection editor
/**
 * List editor for small ordered tables (commitments, projects, endorsements):
 * add, edit in a dialog, show/hide on site, move up/down, delete.
 */
export function Collection({
  table,
  match = {},
  fields,
  defaults,
  summary,
  noun,
}: {
  table: string;
  match?: Row;
  fields: FieldDef[];
  defaults: Row;
  summary: (row: Row) => {
    title: string;
    subtitle?: string;
    image?: string | null;
    badge?: ReactNode;
  };
  noun: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const matchKey = JSON.stringify(match);

  const load = useCallback(async () => {
    const { data, error } = await db
      .from(table)
      .select("*")
      .match(JSON.parse(matchKey) as Row)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(errMsg(error));
    setRows((data as Row[]) ?? []);
  }, [table, matchKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const required = fields.filter((f) => "required" in f && f.required).map((f) => f.name);

  async function save() {
    if (!editing) return;
    const missing = required.find((k) => !String(editing[k] ?? "").trim());
    if (missing) {
      toast.error(`Please fill in “${fields.find((f) => f.name === missing)?.label}”.`);
      return;
    }
    setSaving(true);
    const payload: Row = {};
    for (const f of fields) {
      const v = editing[f.name];
      payload[f.name] =
        f.type === "items"
          ? normalizeItems(v).map((it) => ({ text: it.text.trim(), image: it.image.trim() }))
          : f.type === "lines"
            ? (Array.isArray(v) ? v : String(v ?? "").split("\n"))
                .map((l) => String(l).trim())
                .filter(Boolean)
            : (v ?? null);
    }
    const { error } = editing["id"]
      ? await db
          .from(table)
          .update(payload)
          .eq("id", editing["id"] as string)
      : await db.from(table).insert({
          ...match,
          ...payload,
          sort_order: Math.max(0, ...(rows ?? []).map((r) => Number(r["sort_order"]) || 0)) + 10,
        });
    setSaving(false);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Saved. It’s live on the site");
    setEditing(null);
    void load();
  }

  async function move(index: number, dir: -1 | 1) {
    if (!rows) return;
    const list: Row[] = rows.map((r, i) => ({ ...r, sort_order: i * 10 }));
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index]!["sort_order"], list[j]!["sort_order"]] = [
      list[j]!["sort_order"],
      list[index]!["sort_order"],
    ];
    setRows([...list].sort((a, b) => Number(a["sort_order"]) - Number(b["sort_order"])));
    const results = await Promise.all(
      list.map((r) =>
        db
          .from(table)
          .update({ sort_order: r["sort_order"] })
          .eq("id", r["id"] as string),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) toast.error(errMsg(failed.error));
  }

  async function togglePublished(row: Row) {
    const { error } = await db
      .from(table)
      .update({ published: !row["published"] })
      .eq("id", row["id"] as string);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success(row["published"] ? "Hidden from the site" : "Now showing on the site");
    void load();
  }

  async function remove(row: Row) {
    const { error } = await db
      .from(table)
      .delete()
      .eq("id", row["id"] as string);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Deleted");
    void load();
  }

  if (!rows) return <Spinner />;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button type="button" className={abtn.primary} onClick={() => setEditing({ ...defaults })}>
          <Plus className="size-4" /> Add {noun}
        </button>
      </div>
      {rows.length === 0 && (
        <Card className="text-sm text-muted-foreground">Nothing here yet.</Card>
      )}
      <ul className="divide-y divide-border rounded-sm border border-border bg-card">
        {rows.map((row, i) => {
          const s = summary(row);
          const hidden = row["published"] === false;
          return (
            <li
              key={String(row["id"])}
              className={`flex items-center gap-3 px-4 py-3 ${hidden ? "opacity-60" : ""}`}
            >
              <span className="w-6 shrink-0 text-center font-serif text-sm font-semibold text-accent-deep">
                {i + 1}
              </span>
              {s.image !== undefined && (
                <span className="size-12 shrink-0 overflow-hidden rounded-sm bg-paper">
                  {s.image && (
                    <img src={siteUrl(s.image)} alt="" className="size-full object-cover" />
                  )}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-bold">{s.title}</div>
                {s.subtitle && (
                  <div className="truncate text-[12.5px] text-muted-foreground">{s.subtitle}</div>
                )}
              </div>
              <div className="hidden shrink-0 sm:block">
                {hidden ? <Badge>Hidden</Badge> : s.badge}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className={abtn.icon}
                  aria-label="Move up"
                  title="Move up"
                  disabled={i === 0}
                  onClick={() => void move(i, -1)}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  className={abtn.icon}
                  aria-label="Move down"
                  title="Move down"
                  disabled={i === rows.length - 1}
                  onClick={() => void move(i, 1)}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  className={abtn.icon}
                  aria-label={hidden ? "Show on site" : "Hide from site"}
                  title={hidden ? "Show on site" : "Hide from site"}
                  onClick={() => void togglePublished(row)}
                >
                  {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                <button
                  type="button"
                  className={abtn.icon}
                  aria-label="Edit"
                  title="Edit"
                  onClick={() => setEditing({ ...row })}
                >
                  <Pencil className="size-4" />
                </button>
                <ConfirmButton
                  label="Delete"
                  title={`Delete this ${noun}?`}
                  description="It will be removed from the website immediately. This can't be undone."
                  onConfirm={() => remove(row)}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <EditDialog
        open={!!editing}
        title={editing?.["id"] ? `Edit ${noun}` : `Add ${noun}`}
        onClose={() => setEditing(null)}
        onSave={() => void save()}
        saving={saving}
      >
        {editing && <FieldsForm fields={fields} value={editing} onChange={setEditing} />}
      </EditDialog>
    </div>
  );
}

// ------------------------------------------------------------------ list of {text, image} rows
/** Each row: the achievement text plus an optional photo of that project. */
export function ItemsEditor({
  value,
  onChange,
}: {
  value: AchievementItem[];
  onChange: (v: AchievementItem[]) => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const patch = (i: number, p: Partial<AchievementItem>) =>
    onChange(value.map((it, j) => (j === i ? { ...it, ...p } : it)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  async function upload(i: number, file: File | undefined) {
    if (!file) return;
    setBusy(i);
    try {
      patch(i, { image: await uploadMedia(file, "projects") });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="space-y-2.5">
      {value.map((it, i) => (
        <div key={i} className="flex gap-3 rounded-sm border border-border bg-paper/60 p-2.5">
          <span className="mt-2 w-5 shrink-0 text-center text-[12.5px] font-bold text-accent-deep">
            {i + 1}
          </span>
          <div className="relative size-16 shrink-0 overflow-hidden rounded-sm border border-dashed border-border bg-card">
            {it.image ? (
              <img src={siteUrl(it.image)} alt="" className="size-full object-cover" />
            ) : (
              <ImagePlus className="absolute inset-0 m-auto size-5 text-muted-foreground" />
            )}
            {busy === i && (
              <span className="absolute inset-0 grid place-items-center bg-card/80">
                <Loader2 className="size-4 animate-spin text-primary" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <textarea
              className={`${inputCls} py-2 text-[13.5px]`}
              rows={2}
              value={it.text}
              placeholder="Describe the achievement…"
              onChange={(e) => patch(i, { text: e.target.value })}
            />
            <div className="mt-1.5 flex flex-wrap gap-3 text-[12.5px] font-bold">
              <label className="cursor-pointer text-primary hover:underline">
                {it.image ? "Replace photo" : "Add photo"}
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  hidden
                  onChange={(e) => void upload(i, e.target.files?.[0])}
                />
              </label>
              {it.image && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => patch(i, { image: "" })}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              className={abtn.icon}
              aria-label="Move up"
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              className={abtn.icon}
              aria-label="Move down"
              disabled={i === value.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              className={abtn.icon}
              aria-label="Remove"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className={abtn.outline}
        onClick={() => onChange([...value, { text: "", image: "" }])}
      >
        <Plus className="size-4" /> Add achievement
      </button>
    </div>
  );
}
