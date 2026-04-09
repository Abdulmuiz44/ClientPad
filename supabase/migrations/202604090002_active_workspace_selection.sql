alter table public.profiles
add column if not exists active_workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists idx_profiles_active_workspace_id on public.profiles(active_workspace_id);
