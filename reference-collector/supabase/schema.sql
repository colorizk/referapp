-- รันไฟล์นี้ใน Supabase: Dashboard > SQL Editor > New query > วางแล้วกด Run
-- ปลอดภัยที่จะรันซ้ำหลายครั้ง (จะไม่ error ถ้าตาราง/policy มีอยู่แล้ว)

create table if not exists links (
  id text primary key,
  url text not null,
  domain text not null,
  title text not null,
  category text not null default 'Uncategorized',
  tags text[] not null default '{}',
  created_at bigint not null
);

-- เปิด Row Level Security แล้วอนุญาตให้ทุกคนที่มี anon key อ่าน/เขียนได้
-- (เหมาะสำหรับใช้คนเดียว/ทีมเล็กที่ไม่ได้กังวลเรื่องคนนอกเข้าถึง anon key)
alter table links enable row level security;

drop policy if exists "allow all select" on links;
create policy "allow all select" on links
  for select using (true);

drop policy if exists "allow all insert" on links;
create policy "allow all insert" on links
  for insert with check (true);

drop policy if exists "allow all update" on links;
create policy "allow all update" on links
  for update using (true);

drop policy if exists "allow all delete" on links;
create policy "allow all delete" on links
  for delete using (true);
