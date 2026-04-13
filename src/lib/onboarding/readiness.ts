import { createClient } from "@/lib/supabase/server";

type ReadinessItemKey =
  | "branding_incomplete"
  | "payment_settings_missing"
  | "no_team_members"
  | "default_terms_missing"
  | "no_leads_or_clients"
  | "no_pipeline_customization"
  | "ai_config_gap";

export type SetupReadinessItem = {
  key: ReadinessItemKey;
  label: string;
  href: string;
  isMissing: boolean;
  optional?: boolean;
};

export type SetupReadiness = {
  completionPercent: number;
  thresholdPercent: number;
  isThresholdReached: boolean;
  missingRequiredCount: number;
  missingItems: SetupReadinessItem[];
  items: SetupReadinessItem[];
};

const DEFAULT_PIPELINE = [
  { name: "New", position: 1, is_closed: false },
  { name: "Contacted", position: 2, is_closed: false },
  { name: "Qualified", position: 3, is_closed: false },
  { name: "Quote Sent", position: 4, is_closed: false },
  { name: "Negotiation", position: 5, is_closed: false },
  { name: "Won", position: 6, is_closed: true },
  { name: "Lost", position: 7, is_closed: true },
] as const;

const READINESS_THRESHOLD_PERCENT = 85;

function hasPipelineCustomization(stages: Array<{ name: string; position: number; is_closed: boolean }>) {
  if (stages.length !== DEFAULT_PIPELINE.length) return true;

  const normalized = [...stages].sort((a, b) => a.position - b.position);

  return normalized.some((stage, idx) => {
    const baseline = DEFAULT_PIPELINE[idx];
    return stage.name !== baseline.name || stage.position !== baseline.position || stage.is_closed !== baseline.is_closed;
  });
}

export async function getSetupReadiness(workspaceId: string): Promise<SetupReadiness> {
...
}

export async function isWorkspaceBootstrapped(workspaceId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("workspace_id", workspaceId)
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
