import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigValid } from "@/lib/config";

export async function GET() {
  const status = {
    app: "ok",
    timestamp: new Date().toISOString(),
    config: isConfigValid() ? "ok" : "missing_required",
    database: "unknown",
  };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("workspaces").select("id").limit(1);
    if (error) {
      status.database = "error";
    } else {
      status.database = "ok";
    }
  } catch (error) {
    status.database = "unreachable";
  }

  const statusCode = status.app === "ok" && status.config === "ok" && status.database === "ok" ? 200 : 503;

  return NextResponse.json(status, { status: statusCode });
}
