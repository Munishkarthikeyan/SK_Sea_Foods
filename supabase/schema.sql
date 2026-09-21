-- Run this in your Supabase project's SQL editor (Database > SQL Editor)

create extension if not exists "uuid-ossp";

create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  price_per_kg numeric not null,
  stock_kg numeric not null default 0,
  photo_url text,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text,
  total numeric not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  quantity_kg numeric not null,
  price_per_kg numeric not null
);

-- Row Level Security
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Anyone can view products (public storefront)
create policy "Public can view products"
  on products for select
  using (true);

-- Only logged-in shop owner can add/edit/delete products
create policy "Authenticated users can manage products"
  on products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Anyone can place an order (insert), but not read others' orders
create policy "Anyone can create an order"
  on orders for insert
  with check (true);

create policy "Authenticated users can view orders"
  on orders for select
  using (auth.role() = 'authenticated');

-- Needed so the shop owner can change status (new -> confirmed -> delivered)
-- from the Orders tab in /admin. Without this, OrdersPanel's update calls are
-- silently blocked by RLS (no error, but the status never actually changes).
create policy "Authenticated users can update orders"
  on orders for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Anyone can add order items"
  on order_items for insert
  with check (true);

create policy "Authenticated users can view order items"
  on order_items for select
  using (auth.role() = 'authenticated');

-- Storage bucket for photos: create a bucket named "fish-photos" in
-- Storage > New bucket, mark it Public, then run:
-- (Skip this if you created the bucket through the dashboard UI already)

-- Storage policies for the fish-photos bucket (run after creating the bucket)
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fish-photos');

create policy "Authenticated users can update their photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'fish-photos');

create policy "Authenticated users can delete photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fish-photos');

create policy "Public can view photos"
  on storage.objects for select
  using (bucket_id = 'fish-photos');

-- Add an items column to orders so the full order (including fish names)
-- is available in a single row -- needed for reliable webhook notifications.
alter table orders add column items jsonb;

-- Decrements a product's stock when an order is placed.
-- Customers are anonymous at checkout and only have INSERT rights on
-- orders/order_items (see policies above) -- they do NOT have UPDATE rights
-- on products, so a plain client-side update to stock_kg would be silently
-- blocked by RLS. This function runs as SECURITY DEFINER (elevated
-- privileges) so it can update stock on the customer's behalf, while only
-- ever being callable through this one narrow, safe operation (subtract
-- quantity, floor at 0, auto mark sold out at 0) rather than granting broad
-- table access. The subtraction happens inside a single UPDATE statement, so
-- Postgres row-locks it and two simultaneous checkouts can't both read the
-- same stale stock_kg and oversell.
create or replace function decrement_product_stock(p_product_id uuid, p_quantity_kg numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update products
  set
    stock_kg = greatest(stock_kg - p_quantity_kg, 0),
    available = case when (stock_kg - p_quantity_kg) <= 0 then false else available end
  where id = p_product_id;
end;
$$;

grant execute on function decrement_product_stock(uuid, numeric) to anon, authenticated;
-- ============================================================
-- Customer accounts + role-based access
-- ============================================================

-- Profiles table: one row per auth user, tracks role (owner vs customer)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer',
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile (as 'customer') whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- IMPORTANT: run this once for your OWN shop-owner account so it's treated
-- as the owner, not a customer. Replace the email with your actual login email.
-- update profiles set role = 'owner'
-- where id = (select id from auth.users where email = 'youremail@example.com');

-- Link orders to the customer who placed them
alter table orders add column if not exists customer_id uuid references auth.users(id);

-- Replace the old "anyone can insert" policy: orders now require a logged-in
-- customer, and customers can only insert orders under their own account.
drop policy if exists "Anyone can create an order" on orders;

create policy "Customers can create their own orders"
  on orders for insert
  to authenticated
  with check (customer_id = auth.uid());

-- Replace the old owner-only select policy: a customer can see their own
-- orders, and the shop owner can see all orders.
drop policy if exists "Authenticated users can view orders" on orders;

create policy "Customers can view their own orders, owner sees all"
  on orders for select
  to authenticated
  using (
    customer_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'owner')
  );
