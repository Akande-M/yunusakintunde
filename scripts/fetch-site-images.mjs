#!/usr/bin/env node
/**
 * One-time: downloads the site images that used to be hosted by Lovable into
 * public/site-images/, so the site no longer depends on Lovable for them.
 *
 *   node scripts/fetch-site-images.mjs        (or: npm run images)
 *
 * Also runs automatically at the start of `npm run build` (with --soft), so a deploy
 * picks up any image that isn't committed yet.
 *
 * Reads every src/assets/*.asset.json (each holds the original Lovable link) and
 * skips files that are already present. Commit public/site-images/ afterwards.
 */
import { readdir, readFile, writeFile, stat, mkdir } from "node:fs/promises";
import { join } from "node:path";

const ORIGIN = process.env.LOVABLE_SITE ?? "https://yunusakintunde.lovable.app";
const outDir = join(process.cwd(), "public", "site-images");
await mkdir(outDir, { recursive: true });

const files = (await readdir("src/assets")).filter((f) => f.endsWith(".asset.json"));
let ok = 0;
let failed = 0;
for (const f of files) {
  const meta = JSON.parse(await readFile(join("src/assets", f), "utf8"));
  const target = join(outDir, meta.original_filename);
  if (
    await stat(target).then(
      (s) => s.size > 0,
      () => false,
    )
  ) {
    console.log(`✓ already there  ${meta.original_filename}`);
    ok++;
    continue;
  }
  const src = meta.lovable_url?.startsWith("http")
    ? meta.lovable_url
    : `${ORIGIN}${meta.lovable_url}`;
  try {
    const res = await fetch(src, { redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    console.log(`↓ downloaded     ${meta.original_filename}`);
    ok++;
  } catch (err) {
    console.error(`✗ FAILED         ${meta.original_filename}: ${err.message}`);
    failed++;
  }
}
console.log(
  `\n${ok} of ${files.length} images in public/site-images/${failed ? `, ${failed} failed` : ""}.`,
);
// --soft (used by `npm run build`): never block a deploy; missing images are reported above.
process.exit(failed && !process.argv.includes("--soft") ? 1 : 0);
