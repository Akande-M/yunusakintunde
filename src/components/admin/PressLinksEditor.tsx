import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  topicOf,
  canonicalUrl,
  getPressLinks,
  savePressLinks,
  sourceOf,
  titleFromUrl,
  type PressLink,
} from "@/lib/press";
import { fetchLinkPreview } from "@/lib/press.functions";
import { NEWS_TOPICS } from "@/lib/cms-defaults";
import { abtn, Card, errMsg, inputCls } from "./kit";

/** Fills a link's title, picture, description and date from the news website, keeping what's typed. */
export async function withPreview(it: PressLink, overwrite = false): Promise<PressLink> {
  const p = await fetchLinkPreview({ data: { url: it.url } });
  const auto = it.title === titleFromUrl(it.url);
  return {
    ...it,
    title: (overwrite || auto) && p.title ? p.title : it.title,
    image: overwrite || !it.image ? p.image || it.image : it.image,
    summary: overwrite || !it.summary ? p.summary || it.summary : it.summary,
    date: overwrite || !it.date ? p.date || it.date : it.date,
  };
}

/** Admin → News: the "In the press" links shown on the News page. */
export function PressLinksEditor() {
  const [items, setItems] = useState<PressLink[] | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => void getPressLinks().then(setItems), []);
  if (!items) return null;

  const set = (next: PressLink[]) => {
    setItems(next);
    setDirty(true);
  };
  const patch = (i: number, p: Partial<PressLink>) =>
    set(items.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function save(next = items!) {
    try {
      await savePressLinks(next);
      setDirty(false);
      toast.success("Saved. The News page is updated.");
    } catch (e) {
      toast.error(errMsg(e as { message?: string }));
    }
  }

  async function add() {
    const u = url.trim();
    if (!/^https?:\/\//.test(u)) {
      toast.error("Paste the full link, starting with https://");
      return;
    }
    if (items!.some((x) => canonicalUrl(x.url) === canonicalUrl(u))) {
      toast.error("That article is already in the list.");
      return;
    }
    setBusy("Reading the article's preview…");
    let it: PressLink = {
      url: u,
      title: titleFromUrl(u),
      source: sourceOf(u),
      date: "",
      image: "",
      summary: "",
    };
    try {
      it = await withPreview(it);
    } catch {
      toast.message("Couldn't read that website's preview. Type the headline yourself.");
    }
    const next = [it, ...items!];
    setItems(next);
    setUrl("");
    setBusy(null);
    await save(next);
  }

  async function refresh(i: number) {
    setBusy(`Refreshing ${i + 1}…`);
    try {
      const it = await withPreview(items![i]!, true);
      patch(i, it);
    } catch (e) {
      toast.error(`Couldn't read that website: ${errMsg(e as { message?: string })}`);
    }
    setBusy(null);
  }

  return (
    <Card className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-[20px] font-semibold">In the press</h2>
          <p className="text-[13px] text-muted-foreground">
            Articles about the Senator on other news websites. Paste a link and the headline,
            picture and description are filled in for you. They show on the News page, 16 per page.
          </p>
        </div>
        <a href="/news#in-the-press" target="_blank" rel="noreferrer" className={abtn.outline}>
          <ExternalLink className="size-4" /> View
        </a>
      </div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          className={inputCls}
          placeholder="https://… paste the article link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void add()}
        />
        <button type="button" className={abtn.primary} disabled={!!busy} onClick={() => void add()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
          link
        </button>
      </div>
      {busy && <p className="mb-3 text-[13px] font-semibold text-primary">{busy}</p>}
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li
            key={it.url}
            className="grid gap-3 rounded-sm border border-border p-3 sm:grid-cols-[120px_minmax(0,1fr)_auto]"
          >
            <div className="aspect-[16/10] overflow-hidden rounded-sm bg-paper-2">
              {it.image && (
                <img
                  src={it.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                />
              )}
            </div>
            <div className="space-y-2">
              <input
                className={`${inputCls} font-semibold`}
                value={it.title}
                aria-label="Headline"
                onChange={(e) => patch(i, { title: e.target.value })}
              />
              <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
                <input
                  className={inputCls}
                  value={it.source}
                  aria-label="Newspaper"
                  onChange={(e) => patch(i, { source: e.target.value })}
                />
                <input
                  className={inputCls}
                  type="date"
                  value={it.date}
                  aria-label="Date"
                  onChange={(e) => patch(i, { date: e.target.value })}
                />
              </div>
              <select
                className={inputCls}
                aria-label="Category"
                value={it.topic || ""}
                onChange={(e) => patch(i, { topic: e.target.value })}
              >
                <option value="">Category: worked out from the headline ({topicOf(it)})</option>
                {NEWS_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <textarea
                className={inputCls}
                rows={2}
                placeholder="Short description"
                value={it.summary}
                onChange={(e) => patch(i, { summary: e.target.value })}
              />
              <input
                className={`${inputCls} text-[12px]`}
                placeholder="Picture link (filled in automatically)"
                value={it.image}
                onChange={(e) => patch(i, { image: e.target.value })}
              />
              <a
                href={it.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-[12px] text-primary"
              >
                {it.url}
              </a>
            </div>
            <div className="flex gap-1 sm:flex-col">
              <button
                type="button"
                className={abtn.icon}
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => set(swap(items, i, i - 1))}
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                className={abtn.icon}
                aria-label="Move down"
                disabled={i === items.length - 1}
                onClick={() => set(swap(items, i, i + 1))}
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                className={abtn.icon}
                aria-label="Fetch the preview again"
                title="Fetch the preview again"
                disabled={!!busy}
                onClick={() => void refresh(i)}
              >
                <RefreshCw className="size-4" />
              </button>
              <button
                type="button"
                className={abtn.icon}
                aria-label="Remove"
                onClick={() => set(items.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {dirty && (
        <div className="sticky bottom-3 mt-4 flex items-center justify-end gap-3 rounded-sm border border-accent bg-card p-3 shadow-lg">
          <span className="text-[13px] font-semibold">You have unsaved changes.</span>
          <button type="button" className={abtn.primary} onClick={() => void save()}>
            Save
          </button>
        </div>
      )}
    </Card>
  );
}

function swap<T>(a: T[], i: number, j: number): T[] {
  const n = [...a];
  [n[i], n[j]] = [n[j]!, n[i]!];
  return n;
}
