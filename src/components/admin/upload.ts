import { db, MEDIA_BUCKET } from "@/lib/db";

export const MAX_VIDEO_MB = 50;
const MAX_IMAGE_EDGE = 2000;
const WEB_SAFE = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export const NOT_PUBLIC_MESSAGE =
  "The photo uploaded, but visitors can't see it because the website's photo storage isn't public. " +
  "In Lovable, ask: “Make the storage bucket named media public.” Then upload again.";

const isHeic = (f: File) => /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);

/** Loads a URL as an image the way a visitor's browser would. */
export function canLoadImage(url: string, timeoutMs = 15000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    const t = window.setTimeout(() => resolve(false), timeoutMs);
    img.onload = () => {
      window.clearTimeout(t);
      resolve(img.naturalWidth > 0);
    };
    img.onerror = () => {
      window.clearTimeout(t);
      resolve(false);
    };
    img.src = url;
  });
}

async function decode(blob: Blob): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(blob);
  } catch {
    return null;
  }
}

/**
 * Turns any photo into something every browser can display, at a sensible size:
 * - iPhone/Mac HEIC photos → JPEG (Chrome, Android and Windows can't show HEIC)
 * - unusual formats (TIFF, BMP…) → JPEG
 * - big photos → max 2000px, re-encoded (visitors are mostly on mobile data)
 * - PNGs keep transparency (logos); small JPEG/PNG/WebP/GIF files pass through untouched
 */
export async function prepareImage(file: File): Promise<{ blob: Blob; type: string; ext: string }> {
  let source: Blob = file;
  let type = file.type;

  if (isHeic(file)) {
    const native = await decode(file); // Safari can decode HEIC itself
    if (native) {
      native.close();
    } else {
      const { default: heic2any } = await import("heic2any");
      const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      source = Array.isArray(out) ? out[0]! : out;
    }
    type = "image/jpeg";
  }

  const webSafe = WEB_SAFE.includes(type);
  if (type === "image/gif" || (webSafe && source.size < 600 * 1024 && !isHeic(file))) {
    return { blob: source, type, ext: type.split("/")[1]!.replace("jpeg", "jpg") };
  }

  const bitmap = await decode(source);
  if (!bitmap) {
    if (webSafe) return { blob: source, type, ext: type.split("/")[1]!.replace("jpeg", "jpg") };
    throw new Error("This photo format isn't supported. Please use a JPG or PNG photo.");
  }
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process this photo. Please try a JPG or PNG.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const keepAlpha = type === "image/png";
  const outType = keepAlpha ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, outType, 0.85));
  if (!blob) throw new Error("Couldn't process this photo. Please try a JPG or PNG.");
  // Keep the original if re-encoding didn't help and the original is already web-safe.
  if (webSafe && !isHeic(file) && blob.size >= source.size && scale === 1) {
    return { blob: source, type, ext: type.split("/")[1]!.replace("jpeg", "jpg") };
  }
  return { blob, type: outType, ext: keepAlpha ? "png" : "jpg" };
}

/** Retries slow loads and asks the server directly, so a slow connection isn't mistaken for private storage. */
export async function isVisible(url: string): Promise<boolean> {
  for (let i = 0; i < 3; i++) {
    if (await canLoadImage(url, 30000)) return true;
    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (res.ok) return (res.headers.get("content-type") ?? "image/").startsWith("image/");
      if (res.status === 400 || res.status === 403 || res.status === 404) return false;
    } catch {
      /* network hiccup: try again */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return true; // uploaded fine and storage didn't refuse it; don't block on a flaky connection
}

function safeName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "file"
  );
}

export async function uploadMedia(
  file: File,
  folder: "news" | "gallery" | "projects" | "site" | "pages",
): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/") || isHeic(file);
  if (!isVideo && !isImage) throw new Error("Only photos and videos can be uploaded.");
  if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
    throw new Error(
      `That video is ${(file.size / 1024 / 1024).toFixed(0)} MB. The limit is ${MAX_VIDEO_MB} MB. Upload long videos to YouTube and paste the link instead.`,
    );
  }

  const prepared = isImage
    ? await prepareImage(file)
    : {
        blob: file as Blob,
        type: file.type,
        ext: (file.name.split(".").pop() ?? "mp4").toLowerCase(),
      };

  const now = new Date();
  const path = `${folder}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto
    .randomUUID()
    .slice(0, 8)}-${safeName(file.name)}.${prepared.ext}`;
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, prepared.blob, {
    cacheControl: "31536000",
    contentType: prepared.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const url = db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

  // Prove a visitor can actually see it, instead of failing silently on the live site.
  if (isImage && !(await isVisible(url))) throw new Error(NOT_PUBLIC_MESSAGE);
  return url;
}
