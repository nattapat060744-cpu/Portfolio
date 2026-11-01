-- ============================================================
-- Portfolio schema for Supabase  (run once in SQL Editor)
-- BEFORE RUNNING: replace YOUR_EMAIL@example.com (appears 6 times)
-- with the email you will use to log in to /admin
-- ============================================================

create type project_category as enum ('system', 'web', 'app', 'graphic', 'video');

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category project_category not null,
  description text,
  tech text[] default '{}',
  cover_url text,
  gallery text[] default '{}',
  youtube_url text,
  demo_url text,
  github_url text,
  year int,
  role text,
  is_published boolean default true,
  sort_order int default 0,
  goal text,                     -- what the project is for
  contribution text,             -- what you did yourself
  outcome text,                  -- result / what you learned
  created_at timestamptz default now()
);

-- single-row table: About page, hero text, stats, skills, timeline
create table site_settings (
  id int primary key default 1 check (id = 1),
  name text,
  tagline text,
  bio text,
  email text,
  stats jsonb default '[]',      -- [{"n":40,"label":"..."}]
  skills jsonb default '[]',     -- [{"name":"...","items":["...","..."]}]
  timeline jsonb default '[]',   -- [{"period":"...","title":"...","detail":"..."}]
  tools text[] default '{}',
  status text,                   -- short text in the round sticker on the hero
  resume_url text,               -- link to resume file
  avatar_url text,               -- profile photo shown in the About section
  facts jsonb default '[]',      -- [{"label":"พื้นที่","value":"กรุงเทพฯ"}]
  learning text[] default '{}',  -- things currently learning
  contact_note text,
  looking_for text[] default '{}',  -- roles / things you are looking for
  socials jsonb default '[]'     -- [{"label":"GitHub","url":"https://..."}]
);

insert into site_settings (id, name, tagline, bio, email, stats, skills, timeline, tools) values (
  1,
  'ชื่อคุณ',
  'นักพัฒนาและครีเอทีฟที่ทำได้ตั้งแต่ระบบหลังบ้าน เว็บ แอป ไปจนถึงงานกราฟิกและตัดต่อวิดีโอ ในที่เดียว',
  'แก้ข้อความแนะนำตัวได้ที่หน้า /admin/settings',
  'hello@example.com',
  '[{"n":40,"label":"โปรเจกต์ที่ส่งมอบ"},{"n":5,"label":"ปีประสบการณ์"},{"n":25,"label":"ลูกค้าและทีม"},{"n":120,"label":"วิดีโอและงานกราฟิก"}]',
  '[{"name":"พัฒนาเว็บและแอป","items":["React","Next.js","TypeScript","Tailwind CSS"]},{"name":"ระบบหลังบ้านและฐานข้อมูล","items":["Supabase","PostgreSQL","SQL"]}]',
  '[{"period":"2025 – ปัจจุบัน","title":"Freelance Developer & Creative","detail":"รับงานเว็บ ระบบ และงานภาพเคลื่อนไหว"}]',
  array['TypeScript','Next.js','React','Tailwind','Supabase','SQL','Figma','Photoshop','Premiere Pro','After Effects']
);

-- ---------- Row Level Security ----------
alter table projects enable row level security;
alter table site_settings enable row level security;

create policy "public read published" on projects
  for select using (is_published = true);
create policy "public read settings" on site_settings
  for select using (true);

create policy "admin all projects" on projects
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com')
  with check ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');
create policy "admin all settings" on site_settings
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com')
  with check ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');

-- ---------- Storage (cover images) ----------
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
  on conflict (id) do nothing;

create policy "public read images" on storage.objects
  for select using (bucket_id = 'portfolio');
create policy "admin write images" on storage.objects
  for all to authenticated
  using (bucket_id = 'portfolio' and (auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com')
  with check (bucket_id = 'portfolio' and (auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');
