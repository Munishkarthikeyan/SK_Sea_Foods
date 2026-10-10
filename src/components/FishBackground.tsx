// Decorative underwater background: fish swim across the screen, bob up and
// down, wag their tails, and bubbles float up. Pure CSS + SVG, no libraries.
// It is fixed behind all page content (-z-10), ignores clicks, and switches
// itself off for people who prefer reduced motion.

type Fish = {
  top: number // % from top of the screen
  size: number // fish width in px
  duration: number // seconds to cross the screen
  delay: number // negative = already mid-swim when the page loads
  dir: 'ltr' | 'rtl'
  color: string
  opacity: number
  bob: number // seconds per up/down bob
}

const FISH: Fish[] = [
  { top: 6, size: 96, duration: 42, delay: -6, dir: 'ltr', color: '#1E7C88', opacity: 0.4, bob: 3.4 },
  { top: 16, size: 46, duration: 26, delay: -18, dir: 'rtl', color: '#E2A33D', opacity: 0.5, bob: 2.4 },
  { top: 27, size: 70, duration: 34, delay: -3, dir: 'ltr', color: '#3FB6C2', opacity: 0.4, bob: 3.0 },
  { top: 38, size: 110, duration: 50, delay: -30, dir: 'rtl', color: '#2F5D74', opacity: 0.3, bob: 4.0 },
  { top: 48, size: 40, duration: 22, delay: -9, dir: 'ltr', color: '#E2A33D', opacity: 0.5, bob: 2.0 },
  { top: 58, size: 84, duration: 40, delay: -22, dir: 'rtl', color: '#1E7C88', opacity: 0.35, bob: 3.6 },
  { top: 68, size: 56, duration: 29, delay: -12, dir: 'ltr', color: '#3FB6C2', opacity: 0.45, bob: 2.6 },
  { top: 78, size: 100, duration: 46, delay: -35, dir: 'rtl', color: '#2F5D74', opacity: 0.3, bob: 3.8 },
  { top: 88, size: 50, duration: 24, delay: -2, dir: 'ltr', color: '#E2A33D', opacity: 0.45, bob: 2.2 },
  { top: 33, size: 34, duration: 20, delay: -14, dir: 'rtl', color: '#3FB6C2', opacity: 0.5, bob: 1.8 },
]

const BUBBLES = [
  { left: 5, size: 10, duration: 14, delay: -2 },
  { left: 14, size: 16, duration: 18, delay: -9 },
  { left: 23, size: 8, duration: 12, delay: -5 },
  { left: 34, size: 14, duration: 16, delay: -12 },
  { left: 46, size: 9, duration: 13, delay: -1 },
  { left: 57, size: 18, duration: 20, delay: -15 },
  { left: 66, size: 11, duration: 15, delay: -7 },
  { left: 75, size: 15, duration: 17, delay: -3 },
  { left: 84, size: 8, duration: 11, delay: -10 },
  { left: 93, size: 13, duration: 19, delay: -6 },
]

export default function FishBackground() {
  return (
    <div
      aria-hidden="true"
      className="fishbg pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <style>{`
        .fishbg-swim {
          position: absolute;
          left: 0;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .fishbg-bob { animation: fishbg-bob ease-in-out infinite; }
        .fishbg-tail {
          transform-origin: 24px 25px;
          animation: fishbg-tail 0.7s ease-in-out infinite;
        }
        .fishbg-bubble {
          position: absolute;
          bottom: -30px;
          border-radius: 9999px;
          border: 1.5px solid rgba(63, 182, 194, 0.55);
          background: rgba(255, 255, 255, 0.35);
          animation: fishbg-rise linear infinite;
        }
        @keyframes fishbg-ltr {
          from { transform: translateX(-150px); }
          to { transform: translateX(calc(100vw + 150px)); }
        }
        @keyframes fishbg-rtl {
          from { transform: translateX(calc(100vw + 150px)); }
          to { transform: translateX(-150px); }
        }
        @keyframes fishbg-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(16px); }
        }
        @keyframes fishbg-tail {
          0%, 100% { transform: rotate(12deg); }
          50% { transform: rotate(-12deg); }
        }
        @keyframes fishbg-rise {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fishbg { display: none; }
        }
      `}</style>

      {BUBBLES.map((b, i) => (
        <span
          key={`b${i}`}
          className="fishbg-bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      {FISH.map((f, i) => (
        <div
          key={`f${i}`}
          className="fishbg-swim"
          style={{
            top: `${f.top}%`,
            opacity: f.opacity,
            animationName: f.dir === 'ltr' ? 'fishbg-ltr' : 'fishbg-rtl',
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        >
          <div
            className="fishbg-bob"
            style={{ animationDuration: `${f.bob}s`, animationDelay: `${-i * 0.7}s` }}
          >
            <svg
              width={f.size}
              height={f.size / 2}
              viewBox="0 0 100 50"
              style={{ display: 'block', transform: f.dir === 'rtl' ? 'scaleX(-1)' : undefined }}
            >
              {/* top fin */}
              <path d="M42 14 Q52 1 63 12 Z" fill={f.color} opacity="0.8" />
              {/* body (head faces right) */}
              <path d="M20 25 C30 6, 70 6, 90 25 C70 44, 30 44, 20 25 Z" fill={f.color} />
              {/* tail wags */}
              <g className="fishbg-tail">
                <path d="M24 25 L2 8 L2 42 Z" fill={f.color} opacity="0.85" />
              </g>
              {/* eye */}
              <circle cx="76" cy="22" r="3.6" fill="#fff" />
              <circle cx="77" cy="22" r="1.7" fill="#0F2A3D" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}