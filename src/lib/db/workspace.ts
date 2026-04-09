import { createClient } from "@/lib/supabase/server";
import type { Role, Workspace } from "@/types/database";

type WorkspaceMembership = {
  role: Role;
  created_at: string;
  workspace: Workspace;
};

function chooseFallbackMembership(memberships: WorkspaceMembership[]) {
  const ownerMembership = memberships.find((membership) => membership.role === "owner");
  return ownerMembership ?? memberships[0] ?? null;
}

export async function getWorkspacesForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, created_at, workspace:workspaces(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.workspace)
    .map((row) => ({
      role: row.role as Role,
      created_at: row.created_at,
      workspace: row.workspace as Workspace,
    }));
}

export async function getWorkspaceForUser(userId: string) {
  const supabase = await createClient();

  const [memberships, profileResult] = await Promise.all([
    getWorkspacesForUser(userId),
    supabase.from("profiles").select("active_workspace_id").eq("id", userId).maybeSingle(),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (!memberships.length) return null;

  const activeWorkspaceId = profileResult.data?.active_workspace_id;
  const activeMembership = activeWorkspaceId
    ? memberships.find((membership) => membership.workspace.id === activeWorkspaceId)
    : undefined;

  const selectedMembership = activeMembership ?? chooseFallbackMembership(memberships);

  if (!selectedMembership) return null;

  if (activeWorkspaceId !== selectedMembership.workspace.id) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ active_workspace_id: selectedMembership.workspace.id })
      .eq("id", userId);

    if (profileError) throw profileError;
  }

  return {
    role: selectedMembership.role,
    workspace: selectedMembership.workspace,
  };
}

export async function setActiveWorkspaceForUser(userId: string, workspaceId: string) {
  const supabase = await createClient();

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) throw new Error("You are not a member of the selected workspace.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ active_workspace_id: workspaceId })
    .eq("id", userId);

  if (profileError) throw profileError;
}

export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, user_id, profiles(full_name, phone)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getWorkspaceById(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workspaces").select("*").eq("id", workspaceId).single();

  if (error) throw error;
  return data as Workspace;
}
