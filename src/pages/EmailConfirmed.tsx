import { Link } from 'react-router-dom'

export default function EmailConfirmed() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-5 bg-paper text-center">
      <div className="h-20 w-20 rounded-full border-2 border-green-600 flex items-center justify-center">
        <svg
          className="h-10 w-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-tide-900 mb-2">
          Email Verified
        </h1>
        <p className="text-tide-600">Your email address was successfully verified.</p>
      </div>
      <Link
        to="/customer-auth"
        className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-neutral-800 hover:scale-105 transition-all duration-150"
      >
        Continue to login
      </Link>
    </main>
  )
}