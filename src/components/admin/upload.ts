import { db, MEDIA_BUCKET } from "@/lib/db";

export const MAX_VIDEO_MB = 50;
const MAX_IMAGE_EDGE = 2000;

/**
 * Phone photos are often 5–12 MB. Visitors are mostly on mobile data, so we
 * downscale to 2000px and re-encode as JPEG (best support for WhatsApp/Facebook
 * link previews) before upload. GIFs and small files are uploaded untouched.
 */
async function compressImage(file: File): Promise<Blob> {
  if (file.type === "image/gif" || file.size < 600 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
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
  folder: "news" | "gallery" | "projects" | "site",
): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("Only photos and videos can be uploaded.");
  if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
    throw new Error(
      `That video is ${(file.size / 1024 / 1024).toFixed(0)} MB. The limit is ${MAX_VIDEO_MB} MB — upload long videos to YouTube and paste the link instead.`,
    );
  }
  const body = isImage ? await compressImage(file) : file;
  const ext = isImage
    ? body === file
      ? (file.name.split(".").pop() ?? "jpg")
      : "jpg"
    : (file.name.split(".").pop() ?? "mp4");
  const now = new Date();
  const path = `${folder}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID().slice(0, 8)}-${safeName(file.name)}.${ext.toLowerCase()}`;
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, body, {
    cacheControl: "31536000",
    contentType: body === file ? file.type : "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
