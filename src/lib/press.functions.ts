import { createServerFn } from "@tanstack/react-start";

export type LinkPreview = { title: string; image: string; summary: string; date: string };

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

function meta(html: string, names: string[]): string {
  for (const n of names) {
    const re1 = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${n}["'][^>]*content=["']([^"']*)["']`,
      "i",
    );
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${n}["']`,
      "i",
    );
    const m = html.match(re1) ?? html.match(re2);
    if (m?.[1]) return decode(m[1]);
  }
  return "";
}

/**
 * Reads a news page's preview details (headline, picture, short description, date) on the
 * server, the same way social media builds link previews. Only the preview is returned.
 */
export const fetchLinkPreview = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => {
    const u = new URL(String(d?.url ?? ""));
    if (!/^https?:$/.test(u.protocol)) throw new Error("Only web links can be previewed.");
    if (!u.hostname.includes(".") || /^[\d.:]+$/.test(u.hostname) || /localhost/i.test(u.hostname))
      throw new Error("That link can't be previewed.");
    return { url: u.toString() };
  })
  .handler(async ({ data }): Promise<LinkPreview> => {
    const res = await fetch(data.url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error(`The website answered ${res.status}.`);
    // Only the <head> matters; stop reading after ~400 KB.
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const dec = new TextDecoder();
      while (html.length < 400_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += dec.decode(value, { stream: true });
        if (/<\/head>/i.test(html)) break;
      }
      void reader.cancel().catch(() => {});
    } else html = (await res.text()).slice(0, 400_000);
    const title =
      meta(html, ["og:title", "twitter:title"]) ||
      decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
    let image = meta(html, [
      "og:image:secure_url",
      "og:image",
      "twitter:image",
      "twitter:image:src",
    ]);
    if (image && !/^https?:/.test(image)) image = new URL(image, data.url).toString();
    const summary = meta(html, ["og:description", "twitter:description", "description"]).slice(
      0,
      280,
    );
    const rawDate =
      meta(html, [
        "article:published_time",
        "og:published_time",
        "datePublished",
        "date",
        "pubdate",
      ]) ||
      html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ||
      "";
    const date = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : "";
    return {
      title: title.replace(
        /\s*[|–-]\s*(Punch Newspapers|Tribune Online|The Nation Newspaper|Daily Times Nigeria)\s*$/i,
        "",
      ),
      image,
      summary,
      date,
    };
  });
