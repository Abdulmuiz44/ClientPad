import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { validateConfig } from "@/lib/config";
import { requireWorkspace } from "@/lib/rbac/permissions";
import { getSetupReadiness } from "@/lib/onboarding/readiness";

export default async function DiagnosticsPage() {
  const { workspace, role } = await requireWorkspace("admin");
  const diagnostics = validateConfig();
  const readiness = await getSetupReadiness(workspace.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Diagnostics"
        description="Owner/admin-only system health and configuration status."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Environment Configuration">
          <div className="space-y-4">
            {diagnostics.map((d) => (
              <div key={d.key} className="flex items-start justify-between border-b border-slate-100 pb-2 last:border-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">{d.key}</p>
                  <p className="text-xs text-slate-500">{d.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      d.status === "ok"
                        ? "bg-emerald-100 text-emerald-800"
                        : d.isOptional
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {d.status}
                  </span>
                  {d.isOptional && <span className="text-[10px] text-slate-400">Optional</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Workspace Resolution">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Active Workspace ID</span>
                <span className="font-mono text-slate-900">{workspace.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Workspace Name</span>
                <span className="text-slate-900">{workspace.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Your Role</span>
                <span className="text-slate-900 capitalize">{role}</span>
              </div>
            </div>
          </Card>

          <Card title="Setup Readiness">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Completion</span>
                <span className="text-sm font-bold text-slate-900">{readiness.completionPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${readiness.completionPercent}%` }}
                />
              </div>
              <ul className="space-y-2">
                {readiness.items.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-xs">
                    <span className={item.isComplete ? "text-emerald-600" : "text-slate-300"}>
                      {item.isComplete ? "✓" : "○"}
                    </span>
                    <span className={item.isComplete ? "text-slate-600" : "text-slate-400"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Integration Status">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Supabase</p>
            <p className="mt-1 text-sm font-bold text-emerald-700">Connected</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Flutterwave</p>
            <p className={`mt-1 text-sm font-bold ${process.env.FLUTTERWAVE_SECRET_KEY ? "text-emerald-700" : "text-slate-400"}`}>
              {process.env.FLUTTERWAVE_SECRET_KEY ? "Configured" : "Not Configured"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">AI Provider</p>
            <p className={`mt-1 text-sm font-bold ${process.env.MISTRAL_API_KEY ? "text-emerald-700" : "text-slate-400"}`}>
              {process.env.MISTRAL_API_KEY ? "Configured" : "Not Configured"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
