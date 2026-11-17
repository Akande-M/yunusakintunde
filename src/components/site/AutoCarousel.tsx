import useEmblaCarousel from "embla-carousel-react";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Endless carousel that slides right-to-left every `interval` ms.
 * Pauses while hovered or focused (so a visitor can read or click a slide),
 * and while the browser tab is hidden. Dots let visitors jump to any slide.
 */
export function AutoCarousel({
  children,
  interval = 5000,
  slideClassName = "basis-full",
  gapClassName = "",
  label,
  dots = true,
  dotsClassName = "",
}: {
  children: ReactNode;
  interval?: number;
  slideClassName?: string;
  gapClassName?: string;
  label: string;
  dots?: boolean;
  dotsClassName?: string;
}) {
  const slides = Children.toArray(children);
  const [viewportRef, api] = useEmblaCarousel({
    loop: slides.length > 1,
    align: "start",
    duration: 32,
  });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const paused = useRef(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    const onInit = () => {
      setSnaps(api.scrollSnapList());
      onSelect();
    };
    onInit();
    api.on("select", onSelect);
    api.on("reInit", onInit);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onInit);
    };
  }, [api]);

  useEffect(() => {
    if (!api || slides.length < 2) return;
    const id = window.setInterval(() => {
      if (!paused.current && !document.hidden) api.scrollNext();
    }, interval);
    return () => window.clearInterval(id);
  }, [api, interval, slides.length]);

  const pause = useCallback(() => (paused.current = true), []);
  const resume = useCallback(() => (paused.current = false), []);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div className={`flex touch-pan-y ${gapClassName}`}>
          {slides.map((child, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              className={`min-w-0 shrink-0 grow-0 ${slideClassName}`}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      {dots && snaps.length > 1 && (
        <div className={`mt-4 flex justify-center gap-2 ${dotsClassName}`}>
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === selected}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${
                i === selected ? "w-6 bg-accent" : "w-2 bg-border hover:bg-accent/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
