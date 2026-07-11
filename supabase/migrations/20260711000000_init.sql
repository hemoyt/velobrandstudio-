-- VeloBrand Studio: initial schema, teams/roles, and row-level security.
--
-- Role hierarchy: owner > admin > editor > viewer.
-- Every team-scoped table is gated by is_team_member(team_id, min_role).
-- Project-scoped tables additionally respect optional per-project sharing
-- narrowing via can_access_project(project_id, min_role) / project_shares.

create extension if not exists "pgcrypto";

create type team_role as enum ('owner', 'admin', 'editor', 'viewer');
create type ai_provider as enum ('openai', 'gemini');
create type project_status as enum ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED');
create type asset_type as enum ('logo', 'mockup', 'social_post', 'business_card', 'social_template');

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role team_role not null default 'viewer',
  invited_by uuid references auth.users(id),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  email text not null,
  role team_role not null default 'viewer',
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);

-- Ciphertext only. Decryption happens server-side (service role + ENCRYPTION_KEY)
-- inside API routes; the anon/authenticated client never sees a usable key even
-- though admins can see that a row exists.
create table provider_keys (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  provider ai_provider not null,
  encrypted_key text not null,
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (team_id, provider)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  client_name text not null,
  industry text not null default 'GENERAL',
  brief text,
  status project_status not null default 'DRAFT',
  share_token uuid unique,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional narrowing of a project's visibility to a subset of team members.
-- If no rows exist for a project, every team member (>= viewer) can see it.
create table project_shares (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_override team_role,
  primary key (project_id, user_id)
);

create table brand_identities (
  project_id uuid primary key references projects(id) on delete cascade,
  business_name text,
  description text,
  color_palette jsonb not null default '[]'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  brand_voice text,
  tagline text,
  target_audience text,
  updated_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  storage_path text not null,
  type asset_type not null,
  prompt text,
  original_prompt text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  storage_path text not null,
  prompt text,
  has_sound boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Added after `assets` exists: which generated logo variant is the project's
-- primary logo (used as the reference image for subsequent mockup generation).
alter table projects add column selected_logo_asset_id uuid references assets(id) on delete set null;

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can be used inside RLS policies
-- on the very tables they query without triggering recursive-policy errors)
-- ---------------------------------------------------------------------------

create or replace function role_rank(r team_role) returns int
language sql immutable as $$
  select case r
    when 'owner' then 4
    when 'admin' then 3
    when 'editor' then 2
    when 'viewer' then 1
  end;
$$;

create or replace function is_team_member(p_team_id uuid, p_min_role team_role default 'viewer')
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = auth.uid()
      and role_rank(tm.role) >= role_rank(p_min_role)
  );
$$;

create or replace function project_team_id(p_project_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select team_id from projects where id = p_project_id;
$$;

-- A user can access a project if they meet the team-level role, AND either
-- no sharing restriction exists on the project, they're explicitly shared on
-- it, or they're a team admin/owner (who can always see everything).
create or replace function can_access_project(p_project_id uuid, p_min_role team_role default 'viewer')
returns boolean
language sql stable security definer set search_path = public as $$
  select
    is_team_member(p.team_id, p_min_role)
    and (
      is_team_member(p.team_id, 'admin')
      or not exists (select 1 from project_shares ps where ps.project_id = p.id)
      or exists (select 1 from project_shares ps where ps.project_id = p.id and ps.user_id = auth.uid())
    )
  from projects p where p.id = p_project_id;
$$;

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_projects_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger set_brand_identities_updated_at before update on brand_identities
  for each row execute function set_updated_at();

-- New team -> creator becomes owner automatically.
create or replace function handle_new_team() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into team_members (team_id, user_id, role) values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_team_created after insert on teams
  for each row execute function handle_new_team();

-- Validates + consumes an invite token for the currently-authenticated user.
create or replace function accept_invite(p_token uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_invite invites%rowtype;
  v_user_email text;
begin
  select * into v_invite from invites
    where token = p_token and accepted_at is null and expires_at > now();

  if not found then
    raise exception 'Invite not found or expired';
  end if;

  select email into v_user_email from auth.users where id = auth.uid();
  if v_user_email is distinct from v_invite.email then
    raise exception 'Invite email does not match the signed-in account';
  end if;

  insert into team_members (team_id, user_id, role, invited_by)
    values (v_invite.team_id, auth.uid(), v_invite.role, v_invite.invited_by)
    on conflict (team_id, user_id) do update set role = excluded.role;

  update invites set accepted_at = now() where id = v_invite.id;

  return v_invite.team_id;
end;
$$;

grant execute on function accept_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table teams enable row level security;
alter table team_members enable row level security;
alter table invites enable row level security;
alter table provider_keys enable row level security;
alter table projects enable row level security;
alter table project_shares enable row level security;
alter table brand_identities enable row level security;
alter table assets enable row level security;
alter table videos enable row level security;
alter table activity_log enable row level security;

-- teams
create policy "members can view their teams" on teams
  for select using (is_team_member(id, 'viewer'));
create policy "authenticated users can create teams" on teams
  for insert with check (created_by = auth.uid());
create policy "admins can update team" on teams
  for update using (is_team_member(id, 'admin'));
create policy "owners can delete team" on teams
  for delete using (is_team_member(id, 'owner'));

-- team_members
create policy "members can view team roster" on team_members
  for select using (is_team_member(team_id, 'viewer'));
create policy "admins can add members" on team_members
  for insert with check (is_team_member(team_id, 'admin'));
create policy "admins can update member roles" on team_members
  for update using (is_team_member(team_id, 'admin'))
  with check (is_team_member(team_id, 'admin') and (role <> 'owner' or is_team_member(team_id, 'owner')));
create policy "admins can remove non-owner members" on team_members
  for delete using (is_team_member(team_id, 'admin') and role <> 'owner');

-- invites
create policy "admins can view invites" on invites
  for select using (is_team_member(team_id, 'admin'));
create policy "admins can create invites" on invites
  for insert with check (is_team_member(team_id, 'admin'));
create policy "admins can update invites" on invites
  for update using (is_team_member(team_id, 'admin'));
create policy "admins can revoke invites" on invites
  for delete using (is_team_member(team_id, 'admin'));

-- provider_keys (ciphertext only; see table comment)
create policy "admins can view provider key metadata" on provider_keys
  for select using (is_team_member(team_id, 'admin'));
create policy "admins can add provider keys" on provider_keys
  for insert with check (is_team_member(team_id, 'admin'));
create policy "admins can rotate provider keys" on provider_keys
  for update using (is_team_member(team_id, 'admin'));
create policy "admins can remove provider keys" on provider_keys
  for delete using (is_team_member(team_id, 'admin'));

-- projects
create policy "team members can view accessible projects" on projects
  for select using (can_access_project(id, 'viewer'));
create policy "editors can create projects" on projects
  for insert with check (is_team_member(team_id, 'editor'));
create policy "editors can update accessible projects" on projects
  for update using (can_access_project(id, 'editor')) with check (can_access_project(id, 'editor'));
create policy "admins can delete projects" on projects
  for delete using (can_access_project(id, 'admin'));

-- project_shares
create policy "admins can view shares, shared users can see their own" on project_shares
  for select using (is_team_member(project_team_id(project_id), 'admin') or user_id = auth.uid());
create policy "admins can manage shares" on project_shares
  for all
  using (is_team_member(project_team_id(project_id), 'admin'))
  with check (is_team_member(project_team_id(project_id), 'admin'));

-- brand_identities
create policy "accessible project members can view brand identity" on brand_identities
  for select using (can_access_project(project_id, 'viewer'));
create policy "editors can upsert brand identity" on brand_identities
  for insert with check (can_access_project(project_id, 'editor'));
create policy "editors can update brand identity" on brand_identities
  for update using (can_access_project(project_id, 'editor')) with check (can_access_project(project_id, 'editor'));
create policy "admins can delete brand identity" on brand_identities
  for delete using (can_access_project(project_id, 'admin'));

-- assets
create policy "accessible project members can view assets" on assets
  for select using (can_access_project(project_id, 'viewer'));
create policy "editors can add assets" on assets
  for insert with check (can_access_project(project_id, 'editor'));
create policy "editors can update assets" on assets
  for update using (can_access_project(project_id, 'editor'));
create policy "editors can delete assets" on assets
  for delete using (can_access_project(project_id, 'editor'));

-- videos
create policy "accessible project members can view videos" on videos
  for select using (can_access_project(project_id, 'viewer'));
create policy "editors can add videos" on videos
  for insert with check (can_access_project(project_id, 'editor'));
create policy "editors can delete videos" on videos
  for delete using (can_access_project(project_id, 'editor'));

-- activity_log (append-only from the members' point of view)
create policy "members can view team activity" on activity_log
  for select using (is_team_member(team_id, 'viewer'));
create policy "members can log their own actions" on activity_log
  for insert with check (is_team_member(team_id, 'viewer') and actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: private "assets" bucket, path convention {team_id}/{project_id}/{file}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
  values ('assets', 'assets', false)
  on conflict (id) do nothing;

create policy "team members can read team assets" on storage.objects
  for select using (
    bucket_id = 'assets'
    and is_team_member(((storage.foldername(name))[1])::uuid, 'viewer')
  );

create policy "editors can upload team assets" on storage.objects
  for insert with check (
    bucket_id = 'assets'
    and is_team_member(((storage.foldername(name))[1])::uuid, 'editor')
  );

create policy "editors can update team assets" on storage.objects
  for update using (
    bucket_id = 'assets'
    and is_team_member(((storage.foldername(name))[1])::uuid, 'editor')
  );

create policy "editors can delete team assets" on storage.objects
  for delete using (
    bucket_id = 'assets'
    and is_team_member(((storage.foldername(name))[1])::uuid, 'editor')
  );
