-- ============================================================
-- JEHOSHAPHAT MENDS PORTFOLIO - SUPABASE SETUP
-- Run this in Supabase SQL Editor.
-- Then create one user in Authentication > Users and insert
-- that user's UUID into admin_users below.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text default 'Graphic Design',
  description text default '',
  image_url text not null,
  project_url text default '',
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.artboards (
  id uuid primary key default gen_random_uuid(),
  title text default 'Artboard',
  image_url text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.projects enable row level security;
alter table public.artboards enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id = auth.uid()); $$;

-- Public read policies
create policy "public read settings" on public.site_settings for select using (true);
create policy "public read projects" on public.projects for select using (true);
create policy "public read artboards" on public.artboards for select using (true);

-- Admin write policies
create policy "admin read admins" on public.admin_users for select to authenticated using (user_id = auth.uid());
create policy "admin manage settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage projects" on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage artboards" on public.artboards for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public submit message" on public.messages for insert with check (true);
create policy "admin read messages" on public.messages for select to authenticated using (public.is_admin());
create policy "admin delete messages" on public.messages for delete to authenticated using (public.is_admin());

-- Storage bucket for all portfolio uploads.
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true) on conflict (id) do update set public = true;

create policy "public view portfolio files" on storage.objects for select using (bucket_id = 'portfolio');
create policy "admin upload portfolio files" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());
create policy "admin update portfolio files" on storage.objects for update to authenticated using (bucket_id = 'portfolio' and public.is_admin()) with check (bucket_id = 'portfolio' and public.is_admin());
create policy "admin delete portfolio files" on storage.objects for delete to authenticated using (bucket_id = 'portfolio' and public.is_admin());

-- Default editable site content.
insert into public.site_settings(key,value) values
('site', '{"site_name":"JEHOSHAPHAT MENDS","hero_title":"JEHOSHAPHAT MENDS","hero_subtitle":"Brand & Graphic Designer","about_text":"I’m a designer with experience creating impactful visuals across brand design, graphic design, UX/UI design and website development.","about_image":"assets/About.jpg","hero_image":"assets/background.png","email":"hello@example.com","phone":"+233 00 000 0000","location":"Accra, Ghana","instagram":"https://instagram.com","facebook":"https://facebook.com"}'::jsonb)
on conflict (key) do nothing;


-- Starter content using the images already included in the GitHub repository.
insert into public.projects(title,category,description,image_url,project_url,sort_order) values
('Libdom Logistics','Logo Design','Starter project from the original portfolio.','assets/Libdom.jpeg','',1),
('Winney','Logo Design','Starter project from the original portfolio.','assets/Winney.jpg','',2),
('SUWMA','Brand Design','Starter project from the original portfolio.','assets/Anniversary.jpg','',3)
on conflict do nothing;

insert into public.artboards(title,image_url,sort_order) values
('Anni','assets/Anni.jpg',1),
('Libdom','assets/Libdom.jpeg',2),
('Nhyira Salon','assets/Nhyira Salon.jpg',3),
('Labour Day','assets/Labour Day 4x4.png',4),
('Seli Frozen Food','assets/Seli frozen food.jpg',5),
('Winney','assets/Winney.jpg',6),
('Ford Collection','assets/Ford collection.jpeg',7),
('Independence','assets/indepenArtboard 2.jpg',8),
('Batter Bliss','assets/Batter Bliss.jpg',9),
('Right Guard','assets/Right Guard.jpg',10)
on conflict do nothing;

-- AFTER creating your Supabase Auth user, replace the UUID below and run:
-- insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');
