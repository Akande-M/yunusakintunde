/**
 * Draws the "I SUPPORT SENATOR AKINTUNDE FOR 2027" share card on a canvas.
 * Canvas (not a DOM screenshot) so the image is identical and sharp on every phone,
 * including iOS Safari. 1080×1350 (4:5) is the size WhatsApp, Instagram and
 * Facebook all display without cropping.
 */
export const CARD_W = 1080;
export const CARD_H = 1350;

/** Bundled copies so the card always has its logos, even if a CMS image fails to load. */
const FALLBACK_APC = "/brand/apc-logo.png";
const FALLBACK_SEAL = "/brand/senate-seal.png";

const C = {
  deep: "#123424",
  green: "#1f5c3b",
  gold: "#b8862e",
  goldDeep: "#9c6f1e",
  cream: "#f7f5ef",
  onDark: "#edf3ee",
  onDarkMuted: "#afc2b5",
};

export type CardInput = {
  photoUrl: string;
  /** 0 = keep the left edge, 0.5 = centre, 1 = right edge (where the face is in a wide photo). */
  photoFocusX?: number;
  apcLogoUrl: string;
  sealUrl: string;
  siteHost: string;
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function ensureFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.allSettled([
    document.fonts.load('800 80px "Public Sans"'),
    document.fonts.load('600 30px "Public Sans"'),
    document.fonts.load('600 56px "Newsreader"'),
  ]);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws an image to fill a circle, cropped like CSS object-fit: cover, biased to the top (faces). */
function drawCircleImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  r: number,
  focusX = 0.5,
) {
  const size = r * 2;
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - r - (w - size) * focusX, cy - r - (h - size) * 0.12, w, h);
  ctx.restore();
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  box: number,
) {
  const s = Math.min(box / img.width, box / img.height);
  const w = img.width * s;
  const h = img.height * s;
  ctx.drawImage(img, x + (box - w) / 2, y + (box - h) / 2, w, h);
}

export async function drawSupportCard(canvas: HTMLCanvasElement, input: CardInput) {
  await ensureFonts();
  const [photo, apc, seal] = await Promise.all([
    loadImage(input.photoUrl),
    loadImage(input.apcLogoUrl).then((i) => i ?? loadImage(FALLBACK_APC)),
    loadImage(input.sealUrl).then((i) => i ?? loadImage(FALLBACK_SEAL)),
  ]);

  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Background
  ctx.fillStyle = C.deep;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Headline band
  const bandH = 370;
  ctx.fillStyle = C.gold;
  ctx.fillRect(0, 0, CARD_W, bandH);
  ctx.fillStyle = C.deep;
  ctx.font = '800 70px "Public Sans", Arial, sans-serif';
  ctx.fillText("I SUPPORT", CARD_W / 2, 118);
  ctx.font = '800 92px "Public Sans", Arial, sans-serif';
  ctx.fillText("SENATOR AKINTUNDE", CARD_W / 2, 222, CARD_W - 80);
  ctx.font = '800 92px "Public Sans", Arial, sans-serif';
  ctx.fillText("FOR 2027", CARD_W / 2, 326);

  // Portrait with gold + cream rings, overlapping the band
  const cx = CARD_W / 2;
  const cy = bandH + 250;
  const r = 230;
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.cream;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
  ctx.fill();
  if (photo) {
    drawCircleImage(ctx, photo, cx, cy, r, input.photoFocusX);
  } else {
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // "RE-ELECT 2027" ribbon on the portrait
  ctx.save();
  ctx.translate(cx + r * 0.62, cy + r * 0.78);
  ctx.rotate(-0.06);
  ctx.font = '800 32px "Public Sans", Arial, sans-serif';
  const ribbonW = ctx.measureText("RE-ELECT 2027").width + 52;
  ctx.fillStyle = C.gold;
  ctx.fillRect(-ribbonW / 2, -34, ribbonW, 64);
  ctx.fillStyle = C.deep;
  ctx.fillText("RE-ELECT 2027", 0, 11);
  ctx.restore();

  // Name
  let y = cy + r + 100;
  ctx.fillStyle = C.onDark;
  ctx.font = '600 54px "Newsreader", Georgia, serif';
  // Balanced two-line name; falls back to wrapping if a line is still too wide.
  for (const part of ["Senator Yunus Abiodun", "Akintunde, PhD"]) {
    for (const line of wrap(ctx, part, CARD_W - 140)) {
      ctx.fillText(line, cx, y);
      y += 62;
    }
  }

  // Details
  y += 4;
  ctx.font = '600 30px "Public Sans", Arial, sans-serif';
  ctx.fillStyle = C.gold;
  ctx.fillText("Senator, Oyo Central Senatorial District", cx, y);
  y += 44;
  ctx.fillStyle = C.onDarkMuted;
  ctx.font = '500 28px "Public Sans", Arial, sans-serif';
  ctx.fillText("All Progressives Congress (APC) · Nigerian Senate", cx, y, CARD_W - 120);

  // Footer strip
  const footY = CARD_H - 150;
  ctx.fillStyle = C.green;
  ctx.fillRect(0, footY, CARD_W, 150);
  const logo = 100;
  if (apc) drawContain(ctx, apc, 50, footY + 25, logo);
  if (seal) drawContain(ctx, seal, CARD_W - 50 - logo, footY + 25, logo);
  ctx.fillStyle = C.onDark;
  ctx.font = 'italic 600 30px "Newsreader", Georgia, serif';
  ctx.fillText(
    "Service to the People. Progress for Oyo Central.",
    cx,
    footY + 66,
    CARD_W - 2 * (logo + 80),
  );
  if (input.siteHost) {
    ctx.fillStyle = C.gold;
    ctx.font = '700 26px "Public Sans", Arial, sans-serif';
    ctx.fillText(input.siteHost, cx, footY + 110);
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}
