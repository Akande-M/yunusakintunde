import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { mergeSettings, type AchievementsSettings } from "@/lib/cms-defaults";
import { normalizeItems } from "@/lib/achievements-data";
import {
  abtn,
  Badge,
  Card,
  Collection,
  errMsg,
  Field,
  ImageField,
  inputCls,
  PageTitle,
  Spinner,
  type FieldDef,
} from "@/components/admin/kit";
import { LetsDoMore } from "@/components/site/Achievements";

export const Route = createFileRoute("/admin/achievements")({
  component: AchievementsAdmin,
});

const FIELDS: FieldDef[] = [
  {
    name: "title",
    label: "Card title",
    type: "text",
    required: true,
    hint: "e.g. “Oyo East Local Government”",
  },
  {
    name: "zone",
    label: "Zone",
    type: "select",
    options: [
      { value: "Ibadan", label: "Ibadan (Akinyele, Egbeda, Lagelu, Oluyole, Ona Ara)" },
      { value: "Oyo", label: "Oyo (Afijio, Atiba, Oyo East, Oyo West)" },
      { value: "Ogbomoso", label: "Ogbomoso (Ogo Oluwa, Surulere)" },
      { value: "Senate", label: "Senate (legislative duties)" },
    ],
  },
  {
    name: "heading",
    label: "List heading",
    type: "text",
    hint: "e.g. “10 major achievements” or “Sponsored bills”",
  },
  {
    name: "items",
    label: "Achievements",
    type: "items",
    required: true,
    hint: "Add a real photo of each project where you have one; without a photo the page shows a matching icon. Numbers like 714 or ₦50,000 are bolded automatically.",
  },
  {
    name: "extra_heading",
    label: "Second list heading (optional)",
    type: "text",
    hint: "e.g. “Schools renovated” or “Motions”",
  },
  {
    name: "extra_items",
    label: "Second list",
    type: "items",
    hint: "e.g. each school renovated, with a photo of it.",
  },
  { name: "published", label: "Show on website", type: "toggle" },
];

type Row = Record<string, unknown>;

function PageSettings() {
  const [value, setValue] = useState<AchievementsSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void db
      .from("site_settings")
      .select("key,value")
      .eq("key", "achievements")
      .then(({ data, error }) => {
        if (error) toast.error(errMsg(error));
        setValue(mergeSettings((data as { key: string; value: unknown }[]) ?? []).achievements);
      });
  }, []);

  if (!value) return <Spinner />;
  const set = <K extends keyof AchievementsSettings>(k: K, v: AchievementsSettings[K]) =>
    setValue({ ...value, [k]: v });

  async function save() {
    setSaving(true);
    const { error } = await db
      .from("site_settings")
      .upsert({ key: "achievements", value }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Saved. It’s live on the site");
  }

  return (
    <Card className="mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold">Page text & “Let’s do more” portrait</h2>
        <a
          href="/achievements"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary"
        >
          <ExternalLink className="size-4" /> View the page
        </a>
      </div>
      <div className="grid gap-x-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <Field label="Heading" hint="Used on the homepage section and the View all page.">
            <input
              className={inputCls}
              value={value.pageTitle}
              onChange={(e) => set("pageTitle", e.target.value)}
            />
          </Field>
          <Field label="Introduction (View all page)">
            <textarea
              className={inputCls}
              rows={3}
              value={value.pageIntro}
              onChange={(e) => set("pageIntro", e.target.value)}
            />
          </Field>
          <Field
            label="Tagline beside the portrait"
            hint="Shown on every carousel card, like the flyer. Leave empty to hide it."
          >
            <input
              className={inputCls}
              value={value.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </Field>
          <Field label="Senator's portrait">
            <ImageField
              value={value.portrait}
              onChange={(url) => set("portrait", url)}
              folder="site"
            />
          </Field>
          <Field
            label="Figures at the top of the page"
            hint="One per line: the number, then a | and the label. E.g. 89 | Solar-powered boreholes delivered"
          >
            <textarea
              className={inputCls}
              rows={4}
              defaultValue={value.stats.map((x) => `${x.n} | ${x.l}`).join("\n")}
              onBlur={(e) =>
                set(
                  "stats",
                  e.target.value
                    .split("\n")
                    .map((l) => l.split("|").map((x) => x.trim()))
                    .filter(([n, l]) => n && l)
                    .map(([n, l]) => ({ n: n!, l: l! })),
                )
              }
            />
          </Field>
          <Field label="Overview heading">
            <input
              className={inputCls}
              value={value.overviewHeading}
              onChange={(e) => set("overviewHeading", e.target.value)}
            />
          </Field>
          <Field label="Overview text">
            <textarea
              className={inputCls}
              rows={3}
              value={value.overview}
              onChange={(e) => set("overview", e.target.value)}
            />
          </Field>
          <Field
            label="Development record by sector"
            hint="A line starting with # is a sector heading; the lines under it are its points."
          >
            <textarea
              className={inputCls}
              rows={14}
              defaultValue={value.record
                .map((g) => [`# ${g.heading}`, ...g.items].join("\n"))
                .join("\n\n")}
              onBlur={(e) => {
                const out: { heading: string; items: string[] }[] = [];
                for (const raw of e.target.value.split("\n")) {
                  const l = raw.trim();
                  if (!l) continue;
                  if (l.startsWith("#")) out.push({ heading: l.replace(/^#+\s*/, ""), items: [] });
                  else if (out.length) out[out.length - 1]!.items.push(l.replace(/^[-*•]\s*/, ""));
                }
                set("record", out);
              }}
            />
          </Field>
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-bold">Preview</span>
          <div className="rounded-lg bg-primary-deep p-4">
            {value.portrait ? (
              <LetsDoMore portrait={value.portrait} tagline={value.tagline} compact />
            ) : (
              <p className="text-[13px] text-on-dark-muted">Add a portrait to show this block.</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button className={abtn.primary} disabled={saving} onClick={() => void save()}>
          {saving && <Loader2 className="size-4 animate-spin" />} Save page settings
        </button>
      </div>
    </Card>
  );
}

function AchievementsAdmin() {
  return (
    <>
      <Link
        to="/admin/pages"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> All pages
      </Link>
      <PageTitle
        title="Major achievements"
        sub="The homepage carousel and the View all page. One card per local government; use the arrows to set the order."
      />
      <PageSettings />
      <h2 className="mb-3 text-[15px] font-bold">Cards</h2>
      <Collection
        table="achievement_cards"
        noun="card"
        fields={FIELDS}
        defaults={{
          title: "",
          zone: "Oyo",
          heading: "10 major achievements",
          items: [],
          extra_heading: "",
          extra_items: [],
          published: true,
        }}
        summary={(r: Row) => {
          const items = normalizeItems(r["items"]);
          const photos = items.filter((it) => it.image).length;
          return {
            title: String(r["title"]),
            subtitle: `${items.length} item${items.length === 1 ? "" : "s"} · ${photos} with photos`,
            badge: (
              <Badge
                tone={r["zone"] === "Senate" ? "gold" : photos < items.length ? "neutral" : "green"}
              >
                {String(r["zone"])}
              </Badge>
            ),
          };
        }}
      />
    </>
  );
}
