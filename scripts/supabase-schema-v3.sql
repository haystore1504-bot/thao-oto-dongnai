-- Chạy SAU KHI đã chạy supabase-schema.sql và supabase-schema-v2.sql.
-- Thêm bảng đánh giá / cảm nhận khách hàng hiển thị dạng slide ở trang chủ.

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  car_name text,
  rating integer not null default 5,
  content text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint testimonials_rating_range check (rating between 1 and 5)
);

create index if not exists testimonials_display_order_idx on testimonials (display_order, created_at desc);

alter table testimonials enable row level security;
create policy "Public can read testimonials" on testimonials
  for select
  using (true);
