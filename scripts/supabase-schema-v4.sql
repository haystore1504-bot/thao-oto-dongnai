-- Chạy SAU KHI đã chạy supabase-schema.sql, v2 và v3.
-- Them cot luu logo website (anh that do admin upload).

alter table site_settings add column if not exists logo_url text;
alter table site_settings add column if not exists logo_path text;
