-- JEHOSHAPHAT MENDS - COMPANY / CLIENT PORTAL
-- Run AFTER your existing portfolio schema.
-- Safe to run more than once.

create extension if not exists pgcrypto;

alter table public.projects add column if not exists client_id uuid;
alter table public.projects add column if not exists status text default 'Planning';
alter table public.projects add column if not exists image_path text;
alter table public.artboards add column if not exists image_path text;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  phone text default '',
  company text default '',
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists public.work_updates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text default '',
  status text default 'In progress',
  created_at timestamptz default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null unique,
  issue_date date default current_date,
  due_date date,
  status text default 'Draft',
  notes text default '',
  currency text default 'GHS',
  created_at timestamptz default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric default 1,
  unit_price numeric default 0
);

create table if not exists public.client_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  sender_type text not null check (sender_type in ('admin','client')),
  message text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.client_notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;
alter table public.work_updates enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.client_messages enable row level security;
alter table public.client_notifications enable row level security;

-- Link project to client after clients table exists.
do $$ begin
  if not exists (select 1 from pg_constraint where conname='projects_client_id_fkey') then
    alter table public.projects add constraint projects_client_id_fkey foreign key (client_id) references public.clients(id) on delete set null;
  end if;
end $$;

-- Policies: remove/recreate to make the script rerunnable.
drop policy if exists "admin manage clients" on public.clients;
drop policy if exists "client read own profile" on public.clients;
drop policy if exists "admin manage updates" on public.work_updates;
drop policy if exists "client read own updates" on public.work_updates;
drop policy if exists "admin manage invoices" on public.invoices;
drop policy if exists "client read own invoices" on public.invoices;
drop policy if exists "admin manage invoice items" on public.invoice_items;
drop policy if exists "client read own invoice items" on public.invoice_items;
drop policy if exists "admin manage client messages" on public.client_messages;
drop policy if exists "client read/write own messages" on public.client_messages;
drop policy if exists "admin manage notifications" on public.client_notifications;
drop policy if exists "client read own notifications" on public.client_notifications;

create policy "admin manage clients" on public.clients for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client read own profile" on public.clients for select to authenticated using (user_id = auth.uid());

create policy "admin manage updates" on public.work_updates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client read own updates" on public.work_updates for select to authenticated using (client_id in (select id from public.clients where user_id = auth.uid()));

create policy "admin manage invoices" on public.invoices for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client read own invoices" on public.invoices for select to authenticated using (client_id in (select id from public.clients where user_id = auth.uid()));

create policy "admin manage invoice items" on public.invoice_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client read own invoice items" on public.invoice_items for select to authenticated using (invoice_id in (select i.id from public.invoices i join public.clients c on c.id=i.client_id where c.user_id=auth.uid()));

create policy "admin manage client messages" on public.client_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client read/write own messages" on public.client_messages for all to authenticated using (client_id in (select id from public.clients where user_id=auth.uid())) with check (client_id in (select id from public.clients where user_id=auth.uid()) and sender_type='client');

create policy "admin manage notifications" on public.client_notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client read own notifications" on public.client_notifications for select to authenticated using (client_id in (select id from public.clients where user_id=auth.uid()));

-- Helper function to create a client profile after signup. It does not require service_role.
create or replace function public.create_client_profile(p_name text, p_email text, p_phone text default '', p_company text default '')
returns public.clients
language plpgsql security definer set search_path=public
as $$
declare result public.clients;
begin
  insert into public.clients(user_id,name,email,phone,company)
  values(auth.uid(), trim(p_name), lower(trim(p_email)), coalesce(p_phone,''), coalesce(p_company,''))
  on conflict (email) do update set user_id=excluded.user_id, name=excluded.name, phone=excluded.phone, company=excluded.company
  returning * into result;
  return result;
end;
$$;
revoke all on function public.create_client_profile(text,text,text,text) from public;
grant execute on function public.create_client_profile(text,text,text,text) to authenticated;

-- Realtime for client messaging/notifications.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='client_messages') then
    alter publication supabase_realtime add table public.client_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='client_notifications') then
    alter publication supabase_realtime add table public.client_notifications;
  end if;
end $$;

-- Optional starter client project status values are controlled by the admin UI.

-- Automatically create/link a client profile after email signup.
create or replace function public.handle_new_client_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'account_type','') = 'client' then
    insert into public.clients(user_id,name,email,phone,company)
    values(new.id, coalesce(new.raw_user_meta_data->>'full_name','Client'), lower(new.email), coalesce(new.raw_user_meta_data->>'phone',''), coalesce(new.raw_user_meta_data->>'company',''))
    on conflict (email) do update set user_id=excluded.user_id, name=excluded.name, phone=excluded.phone, company=excluded.company;
  end if;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_client on auth.users;
create trigger on_auth_user_created_client after insert on auth.users for each row execute function public.handle_new_client_user();

-- Client message policies are deliberately split so clients cannot delete or modify admin messages.
drop policy if exists "client read/write own messages" on public.client_messages;
drop policy if exists "client read own messages" on public.client_messages;
drop policy if exists "client send own messages" on public.client_messages;
drop policy if exists "client update own message read" on public.client_messages;
create policy "client read own messages" on public.client_messages for select to authenticated using (client_id in (select id from public.clients where user_id=auth.uid()));
create policy "client send own messages" on public.client_messages for insert to authenticated with check (client_id in (select id from public.clients where user_id=auth.uid()) and sender_type='client');
create policy "client update own message read" on public.client_messages for update to authenticated using (client_id in (select id from public.clients where user_id=auth.uid())) with check (client_id in (select id from public.clients where user_id=auth.uid()));

drop policy if exists "client update own notifications" on public.client_notifications;
create policy "client update own notifications" on public.client_notifications for update to authenticated using (client_id in (select id from public.clients where user_id=auth.uid())) with check (client_id in (select id from public.clients where user_id=auth.uid()));
