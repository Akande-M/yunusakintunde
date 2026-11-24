/*
 * Frame shape for a CMS image, chosen by the editor (Landscape / Portrait / Square / Original).
 * Stored on the image link itself as "#shape=portrait", so it works for every image field
 * without database changes. Browsers ignore the "#…" part when loading the image.
 */
export type Shape = "landscape" | "portrait" | "square" | "original";

export const SHAPES: { value: Shape; label: string }[] = [
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "square", label: "Square" },
  { value: "original", label: "Original" },
];

const SHAPE_RE = /#shape=(landscape|portrait|square|original)$/;

export function splitShape(url: string | null | undefined): { src: string; shape: Shape | null } {
  const u = url ?? "";
  const m = SHAPE_RE.exec(u);
  return m ? { src: u.slice(0, m.index), shape: m[1] as Shape } : { src: u, shape: null };
}

export function withShape(url: string, shape: Shape | null): string {
  const { src } = splitShape(url);
  return src && shape ? `${src}#shape=${shape}` : src;
}

/** Tailwind aspect classes for each frame. "original" keeps the photo's own shape. */
export const SHAPE_ASPECT: Record<Exclude<Shape, "original">, string> = {
  landscape: "aspect-[4/3]",
  portrait: "aspect-[4/5]",
  square: "aspect-square",
};
