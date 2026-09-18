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
