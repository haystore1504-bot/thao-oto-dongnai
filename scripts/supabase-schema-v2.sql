-- Chạy file này SAU KHI đã chạy scripts/supabase-schema.sql lần đầu.
-- Thêm: cài đặt nội dung trang web (banner, liên hệ) + yêu cầu bán xe từ khách.

create table if not exists site_settings (
  id integer primary key default 1,
  hero_slides jsonb not null default '[]',
  hotline text not null default '0900.000.000',
  address text not null default 'Đang cập nhật, Đồng Nai',
  email text not null default 'lienhe@thaootodongnai.vn',
  working_hours text not null default 'Thứ 2 - Thứ 7: 8:00 - 18:00, Chủ nhật: 8:00 - 12:00',
  updated_at timestamptz not null default now(),
  constraint site_settings_single_row check (id = 1)
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

alter table site_settings enable row level security;
create policy "Public can read site settings" on site_settings
  for select
  using (true);

create table if not exists sell_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  brand text,
  model_year integer,
  mileage_km integer,
  description text,
  images jsonb not null default '[]',
  status text not null default 'moi',
  created_at timestamptz not null default now()
);

create index if not exists sell_requests_created_at_idx on sell_requests (created_at desc);

alter table sell_requests enable row level security;
create policy "Anyone can submit a sell request" on sell_requests
  for insert
  with check (true);

-- Không có policy "select" công khai: chỉ admin (qua Service Role Key) mới đọc được danh sách yêu cầu bán xe.
