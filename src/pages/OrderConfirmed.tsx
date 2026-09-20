import { Link } from 'react-router-dom'

export default function OrderConfirmed() {
  return (
    <main className="max-w-lg mx-auto px-5 py-20 text-center">
      <p className="text-xs uppercase tracking-wide text-catch-dark font-semibold mb-2">
        Order placed
      </p>
      <h1 className="font-display text-2xl font-bold mb-4">Thanks — we've got your order</h1>
      <p className="text-tide-600 mb-8">
        We'll call you shortly to confirm delivery time. Pay on delivery by cash or UPI.
      </p>
      <Link to="/" className="text-tide-900 underline underline-offset-4">
        Back to today's catch
      </Link>
    </main>
  )
}