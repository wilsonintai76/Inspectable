-- Inspectable Supabase schema
-- Run in Supabase SQL editor

-- Extension
create extension if not exists pgcrypto;

-- Departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  acronym text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Application Users (profile)
create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  departmentId uuid references public.departments(id) on delete set null,
  photoURL text,
  status text not null check (status in ('Verified','Unverified')),
  role text[] not null default array['Viewer']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_role_valid check (role <@ array['Admin','Asset Officer','Auditor','Viewer']::text[])
);

-- Locations
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  departmentId uuid references public.departments(id) on delete set null,
  supervisor text,
  contactNumber text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Inspections
create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  locationId uuid references public.locations(id) on delete cascade,
  departmentId uuid references public.departments(id) on delete set null,
  locationName text not null,
  supervisor text,
  contactNumber text,
  auditor1 text,
  auditor2 text,
  date timestamptz not null,
  status text not null check (status in ('Pending','Complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_departments_name on public.departments(name);
create index if not exists idx_locations_department on public.locations(departmentId);
create index if not exists idx_inspections_date on public.inspections(date);
create index if not exists idx_inspections_department on public.inspections(departmentId);

-- Trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers
drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at 
  before update on public.departments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_locations_updated_at on public.locations;
create trigger trg_locations_updated_at 
  before update on public.locations
  for each row execute function public.set_updated_at();

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at 
  before update on public.app_users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_inspections_updated_at on public.inspections;
create trigger trg_inspections_updated_at 
  before update on public.inspections
  for each row execute function public.set_updated_at();

-- Realtime (Optional - requires paid Supabase plan)
-- To enable live updates across clients without refresh:
-- 1. Upgrade to Supabase Pro or higher
-- 2. Go to: Supabase Dashboard → Database → Replication
-- 3. Enable replication for: app_users, departments, locations, inspections
-- Note: App works fine without Realtime; users just need to refresh to see changes.

-- Enable RLS
alter table public.app_users enable row level security;
alter table public.departments enable row level security;
alter table public.locations enable row level security;
alter table public.inspections enable row level security;

-- Policies: Read (all authenticated users)
create policy "read_app_users" on public.app_users
  for select to authenticated using (true);

create policy "read_departments" on public.departments
  for select to authenticated using (true);

create policy "read_locations" on public.locations
  for select to authenticated using (true);

create policy "read_inspections" on public.inspections
  for select to authenticated using (true);

-- Policies: app_users
create policy "insert_own_profile" on public.app_users
  for insert to authenticated
  with check (id = auth.uid());

create policy "update_own_profile" on public.app_users
  for update to authenticated
  using (id = auth.uid());

create policy "admin_update_any_profile" on public.app_users
  for update to authenticated
  using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() and ('Admin' = any(au.role))
    )
  );

-- Policies: departments
create policy "mutate_departments" on public.departments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() 
        and ('Admin' = any(au.role) or 'Asset Officer' = any(au.role))
    )
  );

create policy "update_departments" on public.departments
  for update to authenticated
  using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() 
        and ('Admin' = any(au.role) or 'Asset Officer' = any(au.role))
    )
  );

create policy "delete_departments" on public.departments
  for delete to authenticated
  using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() and ('Admin' = any(au.role))
    )
  );

-- Policies: locations
create policy "mutate_locations" on public.locations
  for insert to authenticated
  with check (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() 
        and ('Admin' = any(au.role) or 'Asset Officer' = any(au.role))
    )
  );

create policy "update_locations" on public.locations
  for update to authenticated
  using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() 
        and ('Admin' = any(au.role) or 'Asset Officer' = any(au.role))
    )
  );

create policy "delete_locations" on public.locations
  for delete to authenticated
  using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() 
        and ('Admin' = any(au.role) or 'Asset Officer' = any(au.role))
    )
  );

-- Policies: inspections
create policy "mutate_inspections" on public.inspections
  for insert to authenticated
  with check (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() 
        and ('Admin' = any(au.role) or 'Asset Officer' = any(au.role))
    )
  );

create policy "update_inspections" on public.inspections
  for update to authenticated
  using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() 
        and ('Admin' = any(au.role) or 'Asset Officer' = any(au.role))
    )
  );

create policy "delete_inspections" on public.inspections
  for delete to authenticated
  using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() 
        and ('Admin' = any(au.role) or 'Asset Officer' = any(au.role))
    )
  );

create policy "auditor_update_auditor_fields" on public.inspections
  for update to authenticated
  using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid() and ('Auditor' = any(au.role))
    )
  )
  with check (
    id in (
      select i.id from public.inspections i
      where i.id = inspections.id
        and i.locationId = inspections.locationId
        and i.departmentId = inspections.departmentId
        and i.locationName = inspections.locationName
        and i.supervisor = inspections.supervisor
        and i.contactNumber = inspections.contactNumber
        and i.date = inspections.date
        and i.status = inspections.status
    )
  );
