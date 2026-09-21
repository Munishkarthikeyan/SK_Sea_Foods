import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const { lines } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();
  const count = lines.reduce((n, l) => n + 1, 0);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

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
      </div>
    </header>
  );
}
