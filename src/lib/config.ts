export type ConfigStatus = "ok" | "missing" | "misconfigured";

export interface ConfigDiagnostic {
  key: string;
  status: ConfigStatus;
  isOptional: boolean;
  isSecret: boolean;
  description: string;
}

export const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];

export const OPTIONAL_ENV_VARS = [
  "FLUTTERWAVE_SECRET_KEY",
  "FLUTTERWAVE_WEBHOOK_HASH",
  "AI_PROVIDER",
  "MISTRAL_API_KEY",
  "MISTRAL_MODEL",
];

export function validateConfig(): ConfigDiagnostic[] {
  const diagnostics: ConfigDiagnostic[] = [];

  const check = (key: string, isOptional: boolean, description: string, isSecret = false) => {
    const value = process.env[key];
    let status: ConfigStatus = "ok";
    if (!value) status = "missing";

    diagnostics.push({
      key,
      status,
      isOptional,
      isSecret,
      description,
    });
  };

  check("NEXT_PUBLIC_SUPABASE_URL", false, "Supabase connection URL");
  check("NEXT_PUBLIC_SUPABASE_ANON_KEY", false, "Supabase anonymous key");
  check("SUPABASE_SERVICE_ROLE_KEY", false, "Supabase service role key", true);
  check("NEXT_PUBLIC_APP_URL", false, "Base URL of the application");

  check("FLUTTERWAVE_SECRET_KEY", true, "Flutterwave API secret key", true);
  check("FLUTTERWAVE_WEBHOOK_HASH", true, "Flutterwave webhook signature hash", true);
  check("AI_PROVIDER", true, "Selected AI provider (e.g., mistral)");
  check("MISTRAL_API_KEY", true, "Mistral AI API key", true);
  check("MISTRAL_MODEL", true, "Mistral AI model name");

  return diagnostics;
}

export function isConfigValid(): boolean {
  return validateConfig()
    .filter((d) => !d.isOptional)
    .every((d) => d.status === "ok");
}

export function getMissingRequiredConfig(): string[] {
  return validateConfig()
    .filter((d) => !d.isOptional && d.status === "missing")
    .map((d) => d.key);
}
