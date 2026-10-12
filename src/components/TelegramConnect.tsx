import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Bot username WITHOUT the @, e.g. kadal_fresh_orders_bot
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined

export default function TelegramConnect() {
  const { session } = useAuth()

  const { data: linked, isLoading } = useQuery({
    queryKey: ['telegram-linked', session?.user.id],
    enabled: !!session,
    // Keep checking every few seconds until the customer has pressed Start in
    // Telegram, then stop.
    refetchInterval: (query) => (query.state.data ? false : 4000),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('telegram_chat_id')
        .eq('id', session!.user.id)
        .maybeSingle()
      if (error) throw error
      return !!data?.telegram_chat_id
    },
  })

  if (!session || !BOT_USERNAME || isLoading) return null

  if (linked) {
    return (
      <p className="text-sm text-tide-600 border border-tide-900/10 bg-white/60 p-3 mb-6">
        ✅ Telegram connected — you'll get a message when your order is confirmed or delivered.
      </p>
    )
  }

  return (
    <div className="border border-tide-900/10 bg-white/60 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="font-semibold text-sm">Get order updates on Telegram</p>
        <p className="text-xs text-tide-400">
          Tap once, press Start in Telegram, and we'll message you when your order is confirmed.
        </p>
      </div>
      <a
        href={`https://t.me/${BOT_USERNAME}?start=${session.user.id}`}
        target="_blank"
        rel="noreferrer"
        className="bg-black text-white px-4 py-2 rounded-full text-sm font-semibold text-center hover:bg-neutral-800 transition-colors"
      >
        Connect Telegram
      </a>
    </div>
  )
}
