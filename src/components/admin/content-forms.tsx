import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  DEFAULT_SETTINGS,
  FOCUS_OPTIONS,
  IMAGE_SLOTS,
  type HeroSlide,
  type SiteSettings,
} from "@/lib/cms-defaults";
import { abtn, Card, Field, ImageField, inputCls } from "@/components/admin/kit";

type Props = { settings: SiteSettings; setSettings: (s: SiteSettings) => void };

// ------------------------------------------------------------------ hero carousel
export function HeroSlidesEditor({ settings, setSettings }: Props) {
  const slides = settings.home.heroSlides;
  const set = (next: HeroSlide[]) =>
    setSettings({ ...settings, home: { ...settings.home, heroSlides: next } });
  const patch = (i: number, p: Partial<HeroSlide>) =>
    set(slides.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j]!, next[i]!];
    set(next);
  };

  return (
    <Card>
      <h2 className="text-[15px] font-bold">Hero photo carousel</h2>
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Slides right to left every 5 seconds. Every photo is cropped to the same upright frame. Use
        “Keep in frame” so the senator's face isn't cut off, and check the preview.
      </p>
      <ul className="space-y-4">
        {slides.map((s, i) => (
          <li
            key={i}
            className="grid gap-4 rounded-sm border border-border p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto]"
          >
            <div className="aspect-[4/5] w-[120px] overflow-hidden rounded-sm bg-paper">
              {s.url && (
                <img
                  src={s.url}
                  alt=""
                  className="size-full object-cover"
                  style={{ objectPosition: s.focus }}
                />
              )}
            </div>
            <div className="min-w-0">
              <ImageField value={s.url} onChange={(url) => patch(i, { url })} folder="site" />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-bold">Describe the photo</span>
                  <input
                    className={inputCls}
                    value={s.alt}
                    onChange={(e) => patch(i, { alt: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-bold">Keep in frame</span>
                  <select
                    className={inputCls}
                    value={s.focus}
                    onChange={(e) => patch(i, { focus: e.target.value })}
                  >
                    {FOCUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="flex gap-1 sm:flex-col">
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
                disabled={i === slides.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                className={abtn.icon}
                aria-label="Remove slide"
                disabled={slides.length <= 1}
                onClick={() => set(slides.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={abtn.outline}
          onClick={() => set([...slides, { url: "", alt: "", focus: "center 20%" }])}
        >
          <Plus className="size-4" /> Add slide
        </button>
        <button
          type="button"
          className={abtn.outline}
          onClick={() => set(DEFAULT_SETTINGS.home.heroSlides)}
        >
          <RotateCcw className="size-4" /> Restore original slides
        </button>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ site images
export function ImagesForm({ settings, setSettings }: Props) {
  const images = settings.images;
  return (
    <div className="space-y-4">
      {IMAGE_SLOTS.map((slot) => {
        const changed = images[slot.key] !== slot.default;
        const isLogo = slot.where.startsWith("Footer") || slot.key === "apcBadge";
        return (
          <Card key={slot.key}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-bold">{slot.label}</h2>
                <p className="text-[12.5px] text-muted-foreground">Appears on: {slot.where}</p>
              </div>
              {changed && (
                <button
                  type="button"
                  className={abtn.outline}
                  onClick={() =>
                    setSettings({ ...settings, images: { ...images, [slot.key]: slot.default } })
                  }
                >
                  <RotateCcw className="size-4" /> Use original
                </button>
              )}
            </div>
            <ImageField
              value={images[slot.key]}
              onChange={(url) =>
                setSettings({ ...settings, images: { ...images, [slot.key]: url || slot.default } })
              }
              folder="site"
            />
            {isLogo && (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Tip: use a PNG with a transparent background for logos.
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ footer
export function FooterForm({ settings, setSettings }: Props) {
  const f = settings.footer;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setSettings({ ...settings, footer: { ...f, [k]: v } });
  return (
    <Card>
      <label className="mb-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4"
          checked={f.showEmblems}
          onChange={(e) => set("showEmblems", e.target.checked)}
        />
        <span>
          <span className="block text-[13px] font-bold">Show the emblem row</span>
          <span className="block text-[12px] text-muted-foreground">
            Senate seal, Oyo arms, APC logo and thumbprint. Change the logos themselves under
            “Images”.
          </span>
        </span>
      </label>
      <Field label="Line above the emblems">
        <input
          className={inputCls}
          value={f.topLine}
          onChange={(e) => set("topLine", e.target.value)}
        />
      </Field>
      <Field label="Short description (beside the portrait)">
        <textarea
          className={inputCls}
          rows={3}
          value={f.blurb}
          onChange={(e) => set("blurb", e.target.value)}
        />
      </Field>
      <Field label="Copyright line" hint="{year} is replaced with the current year automatically.">
        <input
          className={inputCls}
          value={f.copyright}
          onChange={(e) => set("copyright", e.target.value)}
        />
      </Field>
      <p className="mb-2 text-[12.5px] text-muted-foreground">
        Social links in the footer are managed under “Social links”.
      </p>
    </Card>
  );
}
