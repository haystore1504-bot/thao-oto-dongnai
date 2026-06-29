create extension if not exists "pgcrypto";

create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  year integer not null,
  mileage_km integer not null,
  price numeric not null,
  transmission text not null default 'Số tự động',
  fuel text not null default 'Xăng',
  color text,
  description text,
  youtube_url text,
  images jsonb not null default '[]',
  is_sold boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cars_brand_idx on cars (brand);
create index if not exists cars_created_at_idx on cars (created_at desc);

alter table cars enable row level security;

-- Trang web public chỉ được đọc (xem xe), không được sửa/xoá trực tiếp.
-- Việc thêm/sửa/xoá xe chỉ thực hiện qua server admin dùng Service Role Key (bỏ qua RLS).
create policy "Public can read cars" on cars
  for select
  using (true);
