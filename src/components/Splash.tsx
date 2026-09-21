export default function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper">
      <img
        src={`${import.meta.env.BASE_URL}Logo.png`}
        alt="SK Sea Foods"
        className="h-16 w-16 object-contain animate-pulse"
      />
      <p className="font-display text-lg text-tide-900">SK Sea Foods</p>
    </div>
  )
}
