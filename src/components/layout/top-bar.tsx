"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { switchActiveWorkspaceAction } from "@/lib/actions/workspace";

type TopBarProps = {
  workspaceName: string;
  activeWorkspaceId: string;
  workspaces: Array<{ id: string; name: string; role: string }>;
};

export function TopBar({ workspaceName, activeWorkspaceId, workspaces }: TopBarProps) {
  const pathname = usePathname();
  const switchFormRef = useRef<HTMLFormElement>(null);

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-slate-500">Workspace</p>
        <p className="truncate text-sm font-semibold text-slate-900">{workspaceName}</p>
      </div>

      <div className="flex items-center gap-2">
        {workspaces.length > 1 ? (
          <form action={switchActiveWorkspaceAction} ref={switchFormRef}>
            <input type="hidden" name="redirect_to" value={pathname || "/dashboard"} />
            <label className="sr-only" htmlFor="workspace_id">
              Switch workspace
            </label>
            <select
              className="min-w-44"
              defaultValue={activeWorkspaceId}
              id="workspace_id"
              name="workspace_id"
              onChange={() => switchFormRef.current?.requestSubmit()}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} ({workspace.role})
                </option>
              ))}
            </select>
          </form>
        ) : null}

        <form action={signOutAction}>
          <button className="border border-slate-300 text-slate-700">Sign out</button>
        </form>
      </div>
    </header>
  );
}
