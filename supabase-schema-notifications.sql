-- Run this AFTER the original Supabase schema.
-- It is safe to run even if the column already exists.

alter table public.messages add column if not exists read_at timestamptz;

-- Allow admins to mark messages read/unread.
drop policy if exists "admin update messages" on public.messages;
create policy "admin update messages"
on public.messages for update to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Enable Supabase Realtime for new enquiry notifications.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
