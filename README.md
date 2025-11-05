# Inspectable

Inspectable is a Next.js (App Router) + TypeScript + Tailwind CSS web app for scheduling and managing asset inspections. It features role-based navigation, real-time data via a central React Context (DataContext), and admin-only API routes. The data/auth backend uses Supabase (Auth + Postgres + Realtime).

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS (with tailwindcss-animate)
- Supabase: Auth, Postgres, Realtime (client) and Service Role on server for admin actions
- Context-based state management (DataContext) with real-time onSnapshot subscriptions

## Core entities

- AppUser: { id, name, email, phone?, departmentId?, photoURL?, status: 'Verified'|'Unverified', role: Role[] }
- Department: { id, name, acronym }
- Location: { id, name, departmentId, supervisor, contactNumber }
- Inspection: { id, locationId, departmentId, locationName, supervisor, contactNumber, date (ISO), auditor1?, auditor2?, status: 'Pending'|'Complete' }

## Quick start (Windows PowerShell)

1) Clone and install

```powershell
git clone https://github.com/<your-org-or-user>/Inspectable.git
cd Inspectable
npm install
```

2) Configure environment variables

Copy .env.local.example to .env.local and fill values from your Supabase project.

```powershell
Copy-Item .env.local.example .env.local
```

Required keys:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only; NEVER expose to the client)

3) Supabase setup

- Create a new Supabase project
- Enable Authentication providers: Email/Password and Google
- Create tables (SQL below) with camelCase columns to match the app’s TypeScript models. You can also run supabase/schema.sql directly.
- Enable Realtime on the tables (Replication > WalR2 for each table)

SQL schema (run in Supabase SQL editor) or run the file supabase/schema.sql:

```sql
-- Enable extensions
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
-- id must equal auth.users.id
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

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
	new.updated_at = now();
	return new;
end $$;

drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at before update on public.departments
for each row execute function public.set_updated_at();

drop trigger if exists trg_locations_updated_at on public.locations;
create trigger trg_locations_updated_at before update on public.locations
for each row execute function public.set_updated_at();

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists trg_inspections_updated_at on public.inspections;
create trigger trg_inspections_updated_at before update on public.inspections
for each row execute function public.set_updated_at();

-- Realtime
alter publication supabase_realtime add table public.app_users, public.departments, public.locations, public.inspections;

-- Row Level Security
alter table public.app_users enable row level security;
alter table public.departments enable row level security;
alter table public.locations enable row level security;
alter table public.inspections enable row level security;

-- Read policies
create policy if not exists "read app_users" on public.app_users for select to authenticated using (true);
create policy if not exists "read departments" on public.departments for select to authenticated using (true);
create policy if not exists "read locations" on public.locations for select to authenticated using (true);
create policy if not exists "read inspections" on public.inspections for select to authenticated using (true);

-- app_users policies
create policy if not exists "insert own profile" on public.app_users for insert to authenticated with check (id = auth.uid());
create policy if not exists "update own profile" on public.app_users for update to authenticated using (id = auth.uid());
create policy if not exists "admin can update any profile" on public.app_users for update to authenticated using (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ('Admin' = any(au.role)))
);

-- Departments policies
create policy if not exists "mutate departments (admin or asset officer)" on public.departments for insert to authenticated with check (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ( 'Admin' = any(au.role) or 'Asset Officer' = any(au.role) ))
);
create policy if not exists "update departments (admin or asset officer)" on public.departments for update to authenticated using (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ( 'Admin' = any(au.role) or 'Asset Officer' = any(au.role) ))
);
create policy if not exists "delete departments (admin)" on public.departments for delete to authenticated using (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ( 'Admin' = any(au.role) ))
);

-- Locations policies
create policy if not exists "mutate locations (admin or asset officer)" on public.locations for insert to authenticated with check (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ( 'Admin' = any(au.role) or 'Asset Officer' = any(au.role) ))
);
create policy if not exists "update locations (admin or asset officer)" on public.locations for update to authenticated using (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ( 'Admin' = any(au.role) or 'Asset Officer' = any(au.role) ))
);
create policy if not exists "delete locations (admin or asset officer)" on public.locations for delete to authenticated using (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ( 'Admin' = any(au.role) or 'Asset Officer' = any(au.role) ))
);

-- Inspections policies
create policy if not exists "mutate inspections (admin or asset officer)" on public.inspections for insert to authenticated with check (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ( 'Admin' = any(au.role) or 'Asset Officer' = any(au.role) ))
);
create policy if not exists "update inspections (admin or asset officer)" on public.inspections for update to authenticated using (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ( 'Admin' = any(au.role) or 'Asset Officer' = any(au.role) ))
);
create policy if not exists "delete inspections (admin or asset officer)" on public.inspections for delete to authenticated using (
	exists (select 1 from public.app_users au where au.id = auth.uid() and ( 'Admin' = any(au.role) or 'Asset Officer' = any(au.role) ))
);

-- Auditors can only change auditor1/auditor2 fields
create policy if not exists "auditor can set auditor fields only" on public.inspections
for update to authenticated
using (
	exists (
		select 1 from public.app_users au
		where au.id = auth.uid() and ( 'Auditor' = any(au.role) )
	)
)
with check (
	id in (
		select i.id
		from public.inspections i
		where i.id = inspections.id
			and i.locationId   = inspections.locationId
			and i.departmentId = inspections.departmentId
			and i.locationName = inspections.locationName
			and i.supervisor   = inspections.supervisor
			and i.contactNumber= inspections.contactNumber
			and i.date         = inspections.date
			and i.status       = inspections.status
	)
);
```

4) Run the app

```powershell
npm run dev
```

Open http://localhost:3000

## Roles and access

- Roles: Admin, Asset Officer, Auditor, Viewer (AppUser.role[])
- Unverified users cannot access the dashboard until an Admin sets status to 'Verified'
- Sidebar and features are role-aware

## Admin API routes (secured)

- DELETE /api/admin/users/[uid] — deletes Supabase Auth user and profile (server uses Service Role)
- POST /api/admin/users/[uid]/set-claims — toggles Admin in app_users.role[] and mirrors 'admin' in app_metadata

Authorization: Server infers the current user from Supabase auth cookies. The handler checks app_users.role[] includes "Admin" before performing actions.

## DataContext

`src/context/DataContext.tsx` uses Supabase auth and realtime to fetch/subscribe, and exposes auth helpers and CRUD functions:

- Auth: signInEmail, signInGoogle, signUp, resetPassword, logout
- Departments: createDepartment, updateDepartment, deleteDepartment
- Locations: createLocation (auto-creates a Pending inspection), updateLocation, deleteLocation
- Inspections: updateInspection, assignSelfAsAuditor, toggleInspectionStatus
- Users: updateUserProfile (self), updateUserAdmin (admin), setUserRoles, verifyUser, deleteUserAdmin
- Helpers: hasRole, isVerified

Wraps the whole app in `app/layout.tsx`.

## Pages

- `/` — Login/Sign Up/Forgot Password
- `/dashboard` — Protected layout with sidebar
- `/dashboard/overview` — Upcoming inspections + summary placeholders
- `/dashboard/departments` — CRUD
- `/dashboard/locations` — CRUD (+ Pending inspection on create)
- `/dashboard/schedule` — Filters, self-assign auditors, edit date
- `/dashboard/report/inspection-status` — Filter + toggle status
- `/dashboard/profile` — Edit own name/phone/department
- `/dashboard/users` — Admin user management (roles, verify, delete, department)

## Development notes

- The UI uses Tailwind classes for now. You can optionally integrate shadcn/ui components for richer primitives later.
- From the Users page, toggling Admin role updates the user's roles. Admin-only API routes check roles from the database and use the Service Role for privileged actions.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint

## Troubleshooting

- If you get Unauthorized from admin routes, ensure your signed-in user has Admin role, and cookies are set (sign out/in).

## Deploying online (Vercel) 🚀

If you want to test the app online, deploy the Next.js app to a host (Vercel recommended) and point it at your Supabase project.

1) Prepare your Supabase project

- In Supabase Dashboard → Settings → API:
	- Copy your Project URL and anon public key.
	- Copy your service_role key (Server only; keep secret).
- In Supabase Dashboard → Authentication → URL Configuration:
	- Site URL: set to your deployed domain, for example: https://your-app.vercel.app
	- Additional Redirect URLs: add your deployed domain(s) and localhost for local testing, for example:
		- https://your-app.vercel.app
		- https://your-app-git-main-your-org.vercel.app (Preview)
		- http://localhost:3000
- If you use OAuth providers (e.g., Google), ensure the Redirect URL shown in the provider settings page in Supabase is added to the provider’s console.

2) Add environment variables in your host (Vercel)

- In Vercel → Project → Settings → Environment Variables, add:
	- NEXT_PUBLIC_SUPABASE_URL = <your Supabase Project URL>
	- NEXT_PUBLIC_SUPABASE_ANON_KEY = <your Supabase anon public key>
	- SUPABASE_SERVICE_ROLE_KEY = <your Supabase service role key> (add to both Production and Preview)
- Note: Do NOT prefix the service role with NEXT_PUBLIC_; it must remain server-only.

3) Deploy

- Push your repo to GitHub/GitLab/Bitbucket.
- Import the project into Vercel and deploy (framework: Next.js is auto-detected).

4) Test

- Open your deployed URL and sign in.
- Middleware will gate /dashboard for Verified users. Use an Admin account to set a user’s status to Verified from /dashboard/users if needed.

5) Troubleshooting (hosted)

- Error: "supabaseUrl is required" or "either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
	- Fix: Ensure the two NEXT_PUBLIC_* variables are set in your host and redeploy.
- Admin routes 401/403
	- Fix: Ensure SUPABASE_SERVICE_ROLE_KEY is set in host env. Also ensure your signed-in user has Admin in app_users.role[].
- OAuth/magic link redirects don’t return to your site
	- Fix: Confirm Supabase Auth → URL Configuration has your deployed domain in Site URL and Additional Redirect URLs.

- Error: "No Output Directory named 'public' found after the Build completed"
	- Cause: Vercel isn’t detecting the project as Next.js (or a custom Output Directory override is set).
	- Fix:
		1) In Vercel → Project → Settings → General, set Framework Preset to "Next.js".
		2) In Settings → Build & Output, disable any "Override" toggles; leave Build Command empty (or "next build") and clear Output Directory (must be blank). Do not set it to "public".
		3) Ensure a minimal `vercel.json` exists with `{ "version": 2, "framework": "nextjs" }` (already included in this repo).
		4) Redeploy.