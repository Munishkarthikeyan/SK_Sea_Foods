# Kadal Fresh — Fish Shop Ordering Site

React + TypeScript + Vite storefront, backed by Supabase (database, auth, photo storage).

## What's included
- **Customer storefront** (`/`) — browse today's catch, add to cart, checkout with delivery details
- **Shop login** (`/login`) — sign in as the shop owner
- **Admin page** (`/admin`, protected) — add new fish daily with a photo, mark items sold out
- Cart state kept in memory with React Context
- Orders + order items saved to Supabase on checkout

## 1. Install dependencies
```bash
npm install
```

## 2. Set up Supabase
1. Create a free project at https://supabase.com
2. Go to **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it. This creates the `products`, `orders`, and `order_items` tables with the right permissions.
3. Go to **Storage**, create a new bucket named `fish-photos`, and mark it **Public** (so product photos load on the storefront).
4. Go to **Authentication > Users**, and manually add one user (your email + a password) — this is your shop-owner login for `/admin`.
5. Go to **Project Settings > API**, and copy your **Project URL** and **anon public key**.

## 3. Configure environment variables
```bash
cp .env.example .env
```
Then fill in:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Run locally
```bash
npm run dev
```
Visit `http://localhost:5173`. Go to `/login`, sign in with the user you created, then `/admin` to add your first fish.

## 5. Deploy
- Push this project to a GitHub repo.
- Import it into [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
- Add the same two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your hosting provider's project settings.
- Deploy — Supabase is already hosted, so there's no separate backend to deploy.

## Next steps you may want
- **Order notifications**: add a Supabase Edge Function that fires on new rows in `orders` and sends you a WhatsApp/Telegram/email alert.
- **Online payment**: integrate Razorpay for UPI/card prepayment instead of cash-on-delivery.
- **Order status page**: let customers check their order status by phone number.
- **Daily reset**: a scheduled function to auto mark everything unavailable at midnight, so you always start the day fresh in `/admin`.

## Order notifications (Telegram bot)

The `supabase/functions/notify-order/index.ts` file is an Edge Function that messages
you on Telegram whenever a new order is placed.

1. On Telegram, message @BotFather, send `/newbot`, follow the prompts, and save the
   token it gives you.
2. Message your new bot once (any text) so it can message you back.
3. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in your browser and find
   your chat ID in the response (`"chat":{"id":...}`).
4. In Supabase: **Project Settings → Edge Functions → Secrets** → add `TELEGRAM_BOT_TOKEN`
   and `TELEGRAM_CHAT_ID`.
5. In Supabase: **Edge Functions** → create/update `notify-order` with this file's code → deploy.
6. In Supabase: **Database → Webhooks** → new webhook on `orders`, event `Insert`,
   target the `notify-order` function.
7. Place a test order and check Telegram.
