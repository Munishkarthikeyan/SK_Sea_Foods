import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { lines } = useCart();
  const count = lines.reduce((n, l) => n + 1, 0);

  return (
    <header className="border-b border-tide-900/10 bg-paper/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-8xl px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/Logo.png"
            alt="SK Sea Foods"
            className="h-10 w-10 object-contain"
          />
          <span className="font-display text-2xl font-semibold text-tide-900">
            SK SEA FOODS
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-catch-dark transition-colors">
            Today's catch
          </Link>
          <Link
            to="/cart"
            className="hover:text-catch-dark transition-colors relative"
          >
            Cart
            {count > 0 && (
              <span className="absolute -top-2 -right-3 bg-catch text-tide-900 text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <Link
            to="/admin"
            className="text-tide-400 hover:text-tide-900 transition-colors"
          >
            Shop login
          </Link>
        </nav>
      </div>
    </header>
  );
}
