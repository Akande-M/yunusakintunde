import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { youtubeId } from "@/lib/cms";
import { IMAGE_SLOTS, mergeSettings, type SiteSettings } from "@/lib/cms-defaults";
import {
  FooterForm,
  HeaderForm,
  HeroSlidesEditor,
  ImagesForm,
} from "@/components/admin/content-forms";
import { uploadMedia } from "@/components/admin/upload";
import { LgaContactsEditor } from "@/components/admin/LgaContactsEditor";
import {
  abtn,
  Card,
  Collection,
  errMsg,
  Field,
  ImageField,
  inputCls,
  PageTitle,
  placeholderWarning,
  Spinner,
  type FieldDef,
} from "@/components/admin/kit";

export const Route = createFileRoute("/admin/content")({
  validateSearch: (s: Record<string, unknown>): { tab?: string } =>
    typeof s["tab"] === "string" ? { tab: s["tab"] } : {},
  component: ContentAdmin,
});

const TABS = [
  ["header", "Header"],
  ["home", "Homepage"],
  ["images", "Images"],
  ["footer", "Footer"],
  ["contact", "Contact details"],
  ["local", "Local contacts"],
  ["socials", "Social links"],
  ["endorsements", "Endorsements"],
] as const;
type Tab = (typeof TABS)[number][0];
type SettingsKey = "header" | "home" | "contact" | "socials" | "footer" | "images";
const SETTINGS_KEYS: SettingsKey[] = ["header", "home", "images", "footer", "contact", "socials"];

const ENDORSEMENT_FIELDS: FieldDef[] = [
  {
    name: "quote",
    label: "Quote",
    type: "textarea",
    rows: 3,
    required: true,
    checkPlaceholder: true,
  },
  { name: "name", label: "Name", type: "text", required: true, checkPlaceholder: true },
  {
    name: "role",
    label: "Title / role",
    type: "text",
    hint: "e.g. “Baale, Oyo West LGA”",
    checkPlaceholder: true,
  },
  { name: "published", label: "Show on website", type: "toggle" },
];

function ContentAdmin() {
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(() =>
    TABS.some(([k]) => k === initialTab) ? (initialTab as Tab) : "home",
  );
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  // Last-saved copy of each settings group, to show "unsaved changes" and never lose an upload.
  const [saved, setSaved] = useState<Record<string, string>>({});

  useEffect(() => {
    void db
      .from("site_settings")
      .select("key,value")
      .then(({ data, error }) => {
        if (error) toast.error(errMsg(error));
        const merged = mergeSettings(data as { key: string; value: unknown }[]);
        setSettings(merged);
        setSaved(Object.fromEntries(SETTINGS_KEYS.map((k) => [k, JSON.stringify(merged[k])])));
      });
  }, []);

  const dirtyKeys = settings
    ? SETTINGS_KEYS.filter((k) => JSON.stringify(settings[k]) !== saved[k])
    : [];
  const dirty = dirtyKeys.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function saveAll() {
    for (const k of dirtyKeys) {
      const ok = await save(k, true);
      if (!ok) return;
    }
    toast.success("All changes saved. They’re live on the site");
  }

  async function save(key: SettingsKey, quiet = false): Promise<boolean> {
    if (!settings) return false;
    // Images: store only the ones changed from the original, so defaults stay in code.
    const value =
      key === "images"
        ? Object.fromEntries(
            IMAGE_SLOTS.filter((s) => settings.images[s.key] !== s.default).map((s) => [
              s.key,
              settings.images[s.key],
            ]),
          )
        : settings[key];
    setSaving(true);
    const { error } = await db.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error(errMsg(error));
      return false;
    }
    setSaved((prev) => ({ ...prev, [key]: JSON.stringify(settings[key]) }));
    if (!quiet) toast.success("Saved. It’s live on the site");
    return true;
  }

  const SaveBtn = ({ k }: { k: SettingsKey }) => (
    <div className="mt-2 flex justify-end">
      <button className={abtn.primary} disabled={saving} onClick={() => void save(k)}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save changes
      </button>
    </div>
  );

  return (
    <>
      <PageTitle
        title="Site content"
        sub="Header bar, homepage carousel and wording, site images and logos, footer, contact details, local government contacts, social links and endorsements."
      />
      <div
        role="tablist"
        className="mb-5 flex flex-wrap gap-1 rounded-sm border border-border bg-card p-1 sm:inline-flex"
      >
        {TABS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-9 rounded-sm px-4 text-[13px] font-bold ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "local" ? (
        <LgaContactsEditor />
      ) : tab === "endorsements" ? (
        <Collection
          table="endorsements"
          noun="endorsement"
          fields={ENDORSEMENT_FIELDS}
          defaults={{ quote: "", name: "", role: "", published: true }}
          summary={(r) => {
            const warn = placeholderWarning(
              `${String(r["name"])} ${String(r["role"])} ${String(r["quote"])}`,
            );
            return {
              title: `${warn ? "⚠ " : ""}${String(r["name"])}`,
              subtitle: warn ?? `“${String(r["quote"])}”`,
            };
          }}
        />
      ) : !settings ? (
        <Spinner />
      ) : tab === "header" ? (
        <>
          <HeaderForm settings={settings} setSettings={setSettings} />
          <SaveBtn k="header" />
        </>
      ) : tab === "home" ? (
        <HomeForm settings={settings} setSettings={setSettings} footer={<SaveBtn k="home" />} />
      ) : tab === "images" ? (
        <>
          <ImagesForm settings={settings} setSettings={setSettings} />
          <SaveBtn k="images" />
        </>
      ) : tab === "footer" ? (
        <>
          <FooterForm settings={settings} setSettings={setSettings} />
          <SaveBtn k="footer" />
        </>
      ) : tab === "contact" ? (
        <Card>
          {(
            [
              ["email", "Email", "office@…"],
              ["phone", "Phone", "+234 …"],
              ["office", "Constituency office address", ""],
              ["hours", "Office hours", "Mon–Fri, 9am–4pm"],
            ] as const
          ).map(([k, label, ph]) => (
            <Field key={k} label={label} warn={placeholderWarning(settings.contact[k])}>
              <input
                className={inputCls}
                placeholder={ph}
                value={settings.contact[k]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, [k]: e.target.value },
                  })
                }
              />
            </Field>
          ))}
          <p className="mb-2 text-[12.5px] text-muted-foreground">
            Shown on Get Involved and the Privacy page. Leave a field empty to hide it.
          </p>
          <SaveBtn k="contact" />
        </Card>
      ) : (
        <Card>
          {(
            [
              ["facebook", "Facebook page link"],
              ["instagram", "Instagram link"],
              ["x", "X (Twitter) link"],
              ["youtube", "YouTube channel link"],
              ["linkedin", "LinkedIn link"],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label}>
              <input
                className={inputCls}
                type="url"
                placeholder="https://…"
                value={settings.socials[k]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socials: { ...settings.socials, [k]: e.target.value.trim() },
                  })
                }
              />
            </Field>
          ))}
          <p className="mb-2 text-[12.5px] text-muted-foreground">
            Filled-in links appear in the footer and make the matching icon in the header top bar
            clickable (Facebook, X, YouTube, Instagram).
          </p>
          <SaveBtn k="socials" />
        </Card>
      )}
      {dirty && (
        <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent bg-card px-5 py-3 shadow-[0_12px_30px_-10px_rgba(18,52,36,.35)]">
          <span className="text-[13.5px] font-semibold">
            ⚠ Unsaved changes. Nothing changes on the website until you save.
          </span>
          <button className={abtn.gold} disabled={saving} onClick={() => void saveAll()}>
            {saving && <Loader2 className="size-4 animate-spin" />} Save all changes
          </button>
        </div>
      )}
    </>
  );
}

function HomeForm({
  settings,
  setSettings,
  footer,
}: {
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
  footer: React.ReactNode;
}) {
  const home = settings.home;
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof SiteSettings["home"]>(k: K, v: SiteSettings["home"][K]) =>
    setSettings({ ...settings, home: { ...home, [k]: v } });
  const setStat = (i: number, patch: Partial<{ n: string; l: string }>) =>
    set(
      "stats",
      home.stats.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    );

  async function uploadVideo(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      set("campaignVideoUrl", await uploadMedia(file, "site"));
      toast.success("Video uploaded. Remember to save");
    } catch (e) {
      toast.error(errMsg(e));
    }
    setUploading(false);
  }

  const videoOk =
    !home.campaignVideoUrl ||
    youtubeId(home.campaignVideoUrl) ||
    /\.(mp4|webm|mov)(\?|$)/i.test(home.campaignVideoUrl);

  return (
    <div className="space-y-5">
      <HeroSlidesEditor settings={settings} setSettings={setSettings} />
      <Card>
        <h2 className="mb-3 text-[15px] font-bold">Top of the homepage</h2>
        <Field label="Small line above the headline">
          <input
            className={inputCls}
            value={home.heroEyebrow}
            onChange={(e) => set("heroEyebrow", e.target.value)}
          />
        </Field>
        <Field label="Headline">
          <textarea
            className={inputCls}
            rows={2}
            value={home.heroTitle}
            onChange={(e) => set("heroTitle", e.target.value)}
          />
        </Field>
        <Field label="Introduction">
          <textarea
            className={inputCls}
            rows={3}
            value={home.heroBody}
            onChange={(e) => set("heroBody", e.target.value)}
          />
        </Field>
      </Card>

      <Card>
        <h2 className="mb-1 text-[15px] font-bold">Headline numbers</h2>
        <p className="mb-3 text-[12.5px] text-muted-foreground">
          The first one also appears on the floating card beside the portrait.
        </p>
        <div className="space-y-2">
          {home.stats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={`${inputCls} w-28`}
                placeholder="38"
                value={s.n}
                onChange={(e) => setStat(i, { n: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Projects delivered"
                value={s.l}
                onChange={(e) => setStat(i, { l: e.target.value })}
              />
              <button
                className={abtn.icon}
                aria-label="Remove"
                disabled={home.stats.length <= 1}
                onClick={() =>
                  set(
                    "stats",
                    home.stats.filter((_, j) => j !== i),
                  )
                }
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        {home.stats.length < 4 && (
          <button
            className={`${abtn.outline} mt-3`}
            onClick={() => set("stats", [...home.stats, { n: "", l: "" }])}
          >
            <Plus className="size-4" /> Add number
          </button>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-[15px] font-bold">Quote & campaign film</h2>
        <Field label="Senator's quote (green band)">
          <textarea
            className={inputCls}
            rows={3}
            value={home.quote}
            onChange={(e) => set("quote", e.target.value)}
          />
        </Field>
        <Field
          label="Campaign film"
          hint="Paste a YouTube link, or upload a video file (over 50 MB it is made smaller automatically first; keep the tab open). Leave empty to show the cover photo."
          warn={videoOk ? null : "This isn't a YouTube link or a video file."}
        >
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="https://youtu.be/…"
              value={home.campaignVideoUrl}
              onChange={(e) => set("campaignVideoUrl", e.target.value.trim())}
            />
            <label className={`${abtn.outline} shrink-0`}>
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}{" "}
              Upload
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                hidden
                onChange={(e) => void uploadVideo(e.target.files?.[0])}
              />
            </label>
          </div>
        </Field>
        <Field label="Film caption">
          <input
            className={inputCls}
            value={home.campaignVideoCaption}
            onChange={(e) => set("campaignVideoCaption", e.target.value)}
          />
        </Field>
        <Field
          label="Film cover (shown before it plays)"
          hint="Optional. Leave empty to use the film-cover photo from Site photos."
        >
          <ImageField
            value={home.campaignVideoPoster ?? ""}
            onChange={(url) => set("campaignVideoPoster", url)}
            folder="site"
          />
        </Field>
      </Card>
      {footer}
    </div>
  );
}
