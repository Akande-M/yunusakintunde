import { SHAPE_ASPECT, splitShape, type Shape } from "@/lib/image-shape";

/**
 * A CMS image in the frame the editor chose (Landscape / Portrait / Square / Original).
 * `fallback` is the frame used when the editor hasn't chosen one.
 */
export function ShapedImage({
  url,
  alt,
  fallback = "landscape",
  className = "",
  imgClassName = "",
  loading = "lazy",
  maxPortraitHeight = true,
}: {
  url: string;
  alt: string;
  fallback?: Shape;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
  /** Keep tall frames from towering over the text next to them. */
  maxPortraitHeight?: boolean;
}) {
  const { src, shape: chosen } = splitShape(url);
  const shape = chosen ?? fallback;
  if (shape === "original")
    return (
      <div className={`overflow-hidden bg-primary-tint ${className}`}>
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={`block h-auto w-full ${imgClassName}`}
        />
      </div>
    );
  return (
    <div
      className={`overflow-hidden bg-primary-tint ${SHAPE_ASPECT[shape]} ${
        shape === "portrait" && maxPortraitHeight
          ? "mx-auto max-h-[640px] w-full max-w-[512px]"
          : ""
      } ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`size-full object-cover ${shape === "portrait" ? "object-[center_25%]" : ""} ${imgClassName}`}
      />
    </div>
  );
}
