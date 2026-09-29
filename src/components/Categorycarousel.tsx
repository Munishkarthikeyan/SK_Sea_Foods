import { useLocation, Link } from "react-router-dom";

export interface CategoryDef {
  key: string | null;
  label: string;
  badge?: string;
  image?: string;
}

export const CATEGORIES: CategoryDef[] = [
  { key: null, label: "Today Deals", image: "/images/categories/today.png",badge: "SALE" },
  { key: null, label: "Sea Fish", image: "/images/categories/Toadysale.jpg"},
  { key: "freshwater-fish", label: "Freshwater Fish", image: "/images/categories/freshwater.jpg" },
  { key: "crabs", label: "Crabs", image: "/images/categories/crab.png" },
  { key: "prawns", label: "Prawns", image: "/images/categories/prawns.jpg" },
  { key: "fillets", label: "Fillets & Slices", image: "/images/categories/slices.jpg" },
  { key: "combos", label: "Combos", image: "/images/categories/combo.jpg" },
  { key: "lobsters", label: "Lobsters", image: "/images/categories/lobster.jpg" },
  { key: "dry-fish", label: "Dry Fish", image: "/images/categories/dry.jpg" },
];

export default function CategoryCarousel() {
  const location = useLocation();

  const activeCategory = new URLSearchParams(location.search).get("category");

  // Duplicate the categories for continuous scrolling
  const items = [...CATEGORIES, ...CATEGORIES];

  return (
    <div className="relative mb-8 w-full overflow-hidden">
      {/* Left Arrow */}
      <button
        type="button"
        aria-label="Scroll left"
        className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-tide-900 shadow-md hover:bg-tide-900/5 active:scale-95"
      >
        ‹
      </button>

      {/* Carousel viewport */}
      <div className="overflow-hidden px-10">
        {/* Moving content */}
        <div
          className="flex w-max gap-4"
          style={{
            animation: "categoryAutoScroll 40s linear infinite",
          }}
        >
          {items.map(({ key, label, image, badge }, index) => {
            const isActive = activeCategory === key;

            return (
              <Link
                key={`${label}-${index}`}
                to={key ? `/shop?category=${key}` : "/shop"}
                className={`relative flex w-28 flex-shrink-0 flex-col items-center gap-2 rounded-xl border bg-white px-3 py-4 shadow-sm ${
                  isActive ? "border-tide-900 shadow-md" : "border-transparent"
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
        className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-tide-900 shadow-md hover:bg-tide-900/5 active:scale-95"
      >
        ›
      </button>

      {/* Animation */}
      <style>{`
        @keyframes categoryAutoScroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(calc(-50% - 8px));
          }
        }
      `}</style>
    </div>
  );
}
