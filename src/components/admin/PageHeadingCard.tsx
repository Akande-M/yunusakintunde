import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS, type PageHeading, type PageHeadings } from "@/lib/cms-defaults";
import { abtn, errMsg, Field, inputCls } from "./kit";

/** The heading at the top of a built-in page (News, Media). Stored in site_settings 'page_headers'. */
export function PageHeadingCard({ page, label }: { page: keyof PageHeadings; label: string }) {
  const [all, setAll] = useState<Partial<Record<keyof PageHeadings, Partial<PageHeading>>>>({});
  const [value, setValue] = useState<PageHeading>(DEFAULT_SETTINGS.page_headers[page]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void db
      .from("site_settings")
      .select("value")
      .eq("key", "page_headers")
      .maybeSingle()
      .then(({ data }) => {
        const v = ((data as { value?: unknown } | null)?.value ?? {}) as typeof all;
        setAll(v);
        setValue({ ...DEFAULT_SETTINGS.page_headers[page], ...(v[page] ?? {}) });
      });
  }, [page]);

  const set = (k: keyof PageHeading, v: string) => {
    setDirty(true);
    setValue((p) => ({ ...p, [k]: v }));
  };

  async function save() {
    setSaving(true);
    const next = { ...all, [page]: value };
    const { error } = await db
      .from("site_settings")
      .upsert({ key: "page_headers", value: next }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    setAll(next);
    setDirty(false);
    toast.success("Page heading saved. It's live on the site.");
  }

  return (
    <details className="group mb-5 rounded-sm border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span>
          <span className="block text-[14px] font-bold">Page heading</span>
          <span className="block text-[12.5px] text-muted-foreground">
            The title and introduction at the top of the {label} page: “{value.title}”
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-5 pt-5 pb-4">
        <Field label="Small label above the title">
          <input
            className={inputCls}
            value={value.eyebrow}
            onChange={(e) => set("eyebrow", e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            className={inputCls}
            value={value.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
        <Field label="Introduction">
          <textarea
            rows={3}
            className={inputCls}
            value={value.lede}
            onChange={(e) => set("lede", e.target.value)}
          />
        </Field>
        <button
          type="button"
          className={abtn.primary}
          disabled={!dirty || saving}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save heading"}
        </button>
      </div>
    </details>
  );
}
