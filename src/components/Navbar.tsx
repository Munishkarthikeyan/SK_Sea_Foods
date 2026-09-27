import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const { lines } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();
  const count = lines.reduce((n, l) => n + 1, 0);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <header className="border-b border-sea-deep/10 bg-sea-light/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-8xl px-5 py-4 flex items-center justify-between">
        <Link
          to="/shop"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2 group"
        >
          <img
            src={`${import.meta.env.BASE_URL}Logo.png`}
            alt="SK Sea Foods"
            className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-display text-2xl font-extrabold tracking-tight text-tide-900">
            SK SEA FOODS
          </span>
        </Link>

        {/* Desktop nav -- hidden on mobile */}
        <nav className="hidden md:flex items-center gap-3 text-sm font-semibold">
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
              className="bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 hover:scale-105 transition-all duration-150"
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

        {/* Mobile hamburger button -- hidden on desktop */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="md:hidden relative h-10 w-10 flex flex-col items-center justify-center gap-1.5 group"
        >
          <span
            className={`block h-0.5 w-6 bg-tide-900 rounded-full transition-all duration-300 ${
              menuOpen ? "translate-y-2 rotate-45" : "group-hover:w-7"
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-tide-900 rounded-full transition-all duration-300 ${
              menuOpen ? "opacity-0" : "group-hover:w-7"
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-tide-900 rounded-full transition-all duration-300 ${
              menuOpen ? "-translate-y-2 -rotate-45" : "group-hover:w-7"
            }`}
          />

          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5">
              {!menuOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              )}
              <span className="relative inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-[10px] font-bold leading-none">
                {count}
              </span>
            </span>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-sea-deep/10 ${
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-5 py-3 gap-1 text-sm font-semibold bg-sea-light/95">
          <Link
            to="/shop"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-tide-900 transition-all duration-150 hover:bg-tide-900/5 hover:translate-x-1"
          >
            Today's catch
          </Link>
          <Link
            to="/cart"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-tide-900 transition-all duration-150 hover:bg-tide-900/5 hover:translate-x-1 flex items-center justify-between"
          >
            Cart
            {count > 0 && (
              <span className="bg-catch text-tide-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <Link
            to="/my-orders"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-tide-900 transition-all duration-150 hover:bg-tide-900/5 hover:translate-x-1"
          >
            My orders
          </Link>
          {session ? (
            <button
              onClick={handleSignOut}
              className="text-left px-3 py-2.5 rounded-lg text-tide-900 transition-all duration-150 hover:bg-tide-900/5 hover:translate-x-1"
            >
              Log out
            </button>
          ) : (
            <Link
              to="/customer-auth"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-tide-900 transition-all duration-150 hover:bg-tide-900/5 hover:translate-x-1"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}