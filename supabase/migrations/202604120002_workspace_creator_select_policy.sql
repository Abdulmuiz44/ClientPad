-- Allow workspace creators to select the row they just created before membership bootstrap completes.

drop policy if exists "workspaces_member_select" on public.workspaces;
create policy "workspaces_member_select" on public.workspaces
for select to authenticated
using (
  created_by = auth.uid()
  or public.user_has_workspace_role(id, array['owner','admin','staff']::workspace_role[])
);
