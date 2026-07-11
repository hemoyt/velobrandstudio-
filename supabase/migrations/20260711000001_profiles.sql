-- Public, queryable mirror of auth.users (id + email only) so team rosters,
-- invites, and activity logs can display who's who. auth.users itself isn't
-- exposed via the API. Standard Supabase pattern.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "authenticated users can view profiles" on profiles
  for select using (auth.role() = 'authenticated');

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function handle_new_user();
