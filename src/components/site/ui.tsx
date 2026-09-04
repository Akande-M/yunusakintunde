import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-sm text-sm font-bold transition-colors min-h-11 px-5 py-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

export const btn = {
  primary: `${BASE} bg-primary text-primary-foreground hover:bg-primary-hover`,
  gold: `${BASE} bg-accent text-accent-foreground hover:bg-accent-hover hover:text-primary-foreground`,
  outline: `${BASE} border border-primary text-primary bg-transparent hover:bg-primary-tint`,
  ghostDark: `${BASE} border border-on-dark-line text-on-dark hover:bg-on-dark-line`,
};

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow mb-3.5">{children}</div>;
}

export function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-[26px] leading-tight font-semibold sm:text-[30px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <section className="border-b border-border bg-paper-2 py-12 sm:py-14">
      <div className="wrap rise-in">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="max-w-[20ch] text-[28px] leading-[1.12] font-semibold sm:text-[34px]">
          {title}
        </h1>
        <p className="mt-3.5 max-w-[62ch] text-[17px] text-muted-foreground">{lede}</p>
      </div>
    </section>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 cursor-pointer rounded-full border px-4 text-[13px] font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

/** Image with a shimmering skeleton until it decodes. */
export function SmartImage({
  src,
  alt,
  className = "",
  ratio = "aspect-[16/10]",
  priority = false,
  overlay,
  imgClassName = "",
}: {
  src: string;
  alt: string;
  className?: string;
  ratio?: string;
  priority?: boolean;
  overlay?: ReactNode;
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Images already decoded before hydration never fire onLoad.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-paper-2 ${ratio} ${className}`}>
      {!loaded && <div className="skeleton-shimmer absolute inset-0" aria-hidden />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`size-full object-cover transition-all duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
      />
      {overlay}
    </div>
  );
}

export function NewsCard({
  date,
  category,
  title,
  summary,
  image,
  alt,
}: {
  date: string;
  category?: string;
  title: string;
  summary: string;
  image: string;
  alt: string;
}) {
  return (
    <article className="group flex flex-col bg-card transition-colors hover:bg-primary-tint/40">
      <SmartImage src={image} alt={alt} className="border-b border-border" />
      <div className="flex flex-1 flex-col gap-2 px-5 pt-5 pb-6">
        <span className="text-xs font-bold text-accent-deep">
          {date}
          {category ? ` · ${category}` : ""}
        </span>
        <h3 className="text-[18px] leading-snug font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{summary}</p>
        <Link
          to="/news"
          className="mt-auto pt-2 text-[13px] font-bold text-primary underline decoration-transparent underline-offset-4 transition group-hover:decoration-current"
        >
          Read update
        </Link>
      </div>
    </article>
  );
}
