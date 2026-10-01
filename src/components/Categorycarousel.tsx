import { useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";

export interface CategoryDef {
  key: string | null;
  label: string;
  badge?: string;
  image?: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    key: null,
    label: "Today Deals",
    image: `${import.meta.env.BASE_URL}images/categories/today.png`,
    badge: "SALE",
  },
  {
    key: "sea-fish",
    label: "Sea Fish",
    image: `${import.meta.env.BASE_URL}images/categories/Sea.jpg`,
  },
  {
    key: "freshwater-fish",
    label: "Freshwater Fish",
    image: `${import.meta.env.BASE_URL}images/categories/freshwater.jpg`,
  },
  {
    key: "crabs",
    label: "Crabs",
    image: `${import.meta.env.BASE_URL}images/categories/crab.png`,
  },
  {
    key: "prawns",
    label: "Prawns",
    image: `${import.meta.env.BASE_URL}images/categories/prawns.jpg`,
  },
  {
    key: "fillets",
    label: "Fillets & Slices",
    image: `${import.meta.env.BASE_URL}images/categories/slices.jpg`,
  },
  {
    key: "combos",
    label: "Combos",
    image: `${import.meta.env.BASE_URL}images/categories/combo.jpg`,
  },
  {
    key: "lobsters",
    label: "Lobsters",
    image: `${import.meta.env.BASE_URL}images/categories/lobster.jpg`,
  },
  {
    key: "dry-fish",
    label: "Dry Fish",
    image: `${import.meta.env.BASE_URL}images/categories/dry.jpg`,
  },
];

export default function CategoryCarousel() {
  const location = useLocation();

  const carouselRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  const activeCategory = new URLSearchParams(location.search).get("category");

  const items = [...CATEGORIES, ...CATEGORIES];

  /*
   * Automatic scrolling
   */
  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    const speed = 0.5;

    const animate = () => {
      if (!isPausedRef.current) {
        carousel.scrollLeft += speed;

        /*
         * Because we duplicated CATEGORIES,
         * reset to the beginning of the second set.
         */
        const halfWidth = carousel.scrollWidth / 2;

        if (carousel.scrollLeft >= halfWidth) {
          carousel.scrollLeft = 0;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  /*
   * Manual arrow scrolling
   */
  const scrollCarousel = (direction: "left" | "right") => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    /*
     * Pause automatic animation while manually scrolling.
     */
    isPausedRef.current = true;

    carousel.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });

    /*
     * Resume automatic animation after manual scroll.
     */
    window.setTimeout(() => {
      isPausedRef.current = false;
    }, 800);
  };

  return (
    <div className="relative mb-8 w-full overflow-hidden">
      {/* Left Arrow */}
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollCarousel("left")}
        className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl text-tide-900 shadow-md transition hover:bg-tide-900/5 active:scale-95"
      >
        ‹
      </button>

      {/* Carousel viewport */}
      <div
        ref={carouselRef}
        className="overflow-x-hidden px-10 scrollbar-hide"
      >
        {/* Moving content */}
        <div className="flex w-max gap-4">
          {items.map(({ key, label, image, badge }, index) => {
            const isActive = activeCategory === key;

            return (
              <Link
                key={`${label}-${index}`}
                to={key ? `/shop?category=${key}` : "/shop"}
                className={`relative flex w-28 flex-shrink-0 flex-col items-center gap-2 rounded-xl border bg-white px-3 py-4 shadow-sm transition ${
                  isActive
                    ? "border-tide-900 shadow-md"
                    : "border-transparent hover:shadow-md"
                }`}
              >
                {badge && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-catch px-2 py-0.5 text-[10px] font-bold text-tide-900 shadow">
                    {badge}
                  </span>
                )}

                {/* IMAGE */}
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-sea-light">
                  <img
                    src={image}
                    alt={label}
                    className="h-full w-full object-cover"
                  />
                </span>

                {/* LABEL */}
                <span className="text-center text-xs font-semibold leading-tight text-tide-900">
                  {label.toUpperCase()}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right Arrow */}
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollCarousel("right")}
        className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl text-tide-900 shadow-md transition hover:bg-tide-900/5 active:scale-95"
      >
        ›
      </button>
    </div>
  );
}

