import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const { lines } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const count = lines.reduce((n, l) => n + 1, 0);

  const activeCategory = new URLSearchParams(location.search).get("category");

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const categoryLinks: { key: string | null; icon: string; label: string }[] = [
    { key: null, icon: "🌊", label: "All" },
    { key: "fish", icon: "🐟", label: "Fish" },
    { key: "crab", icon: "🦀", label: "Crab" },
    { key: "prawn", icon: "🦐", label: "Prawn" },
  ];

  return (
    <header className="border-b border-sea-deep/10 bg-sea-light/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-8xl px-5 py-4 flex items-center justify-between">
        <Link to="/shop" className="flex items-center gap-2 group">
          <img
            src={`${import.meta.env.BASE_URL}Logo.png`}
            alt="SK Sea Foods"
            className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-display text-2xl font-extrabold tracking-tight text-tide-900">
            SK SEA FOODS
          </span>
        </Link>

        <div className="flex items-center gap-4 w-[666px] justify-end">
          {categoryLinks.map(({ key, icon, label }) => {
            const isActive = activeCategory === key
            return (
              <Link
                key={label}
                to={key ? `/shop?category=${key}` : '/shop'}
                title={label}
                className={`text-2xl leading-none transition-all duration-150 hover:scale-125 ${
                  isActive ? 'scale-125 drop-shadow-md' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {icon}
              </Link>
            )
          })}
        </div>

        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link
            to="/shop"
            className="bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 hover:scale-105 transition-all duration-150"
          >
            Today's catch
          </Link>
          <Link
            to="/cart"
            className="relative bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 hover:scale-105 transition-all duration-150"
          >
            Cart
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-catch text-tide-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <Link
            to="/my-orders"
            className="bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 hover:scale-105 transition-all duration-150"
          >
            My orders
          </Link>
          {session ? (
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 hover:scale-105 transition-all duration-150"
            >
              Log out
            </button>
          ) : (
            <Link
              to="/customer-auth"
              className="bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 hover:scale-105 transition-all duration-150"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}