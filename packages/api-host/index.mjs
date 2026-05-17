import { createClientPadCloudHandler } from "@clientpad/cloud";
import { createClientPadHandler } from "@clientpad/server";

const getEnv = (name) => globalThis.Netlify?.env?.get?.(name) ?? "";

const runtimeConfig = {
  databaseUrl: getEnv("DATABASE_URL"),
  apiKeyPepper: getEnv("API_KEY_PEPPER"),
  adminToken: getEnv("CLIENTPAD_CLOUD_ADMIN_TOKEN"),
};

const missingConfig = Object.entries(runtimeConfig)
  .filter(([, value]) => typeof value !== "string" || !value.trim())
  .map(([key]) => key);

const hasRuntimeConfig = missingConfig.length === 0;

const cloudHandler = hasRuntimeConfig
  ? createClientPadCloudHandler({
      databaseUrl: runtimeConfig.databaseUrl,
      apiKeyPepper: runtimeConfig.apiKeyPepper,
      adminToken: runtimeConfig.adminToken,
    })
  : null;

const publicHandler = hasRuntimeConfig
  ? createClientPadHandler({
      databaseUrl: runtimeConfig.databaseUrl,
      apiKeyPepper: runtimeConfig.apiKeyPepper,
    })
  : null;

const routes = [
  "/",
  "/health",
  "/api/cloud/v1",
  "/api/cloud/v1/*",
  "/api/public/v1",
  "/api/public/v1/*",
];

export default async function handler(request) {
  const url = new URL(request.url);

  if (url.pathname === "/" || url.pathname === "/health") {
    return Response.json({
      status: hasRuntimeConfig ? "ok" : "configuration_required",
      service: "@clientpad/api-host",
      configured: hasRuntimeConfig,
      missing: missingConfig,
      routes: {
        cloud: "/api/cloud/v1",
        public: "/api/public/v1",
      },
      time: new Date().toISOString(),
    });
  }

  if (url.pathname.startsWith("/api/cloud/v1")) {
    if (!cloudHandler) {
      return Response.json(
        {
          status: "configuration_required",
          service: "@clientpad/api-host",
          missing: missingConfig,
          message: "Cloud API is not configured yet.",
        },
        { status: 503 }
      );
    }
    return cloudHandler(request);
  }

  if (url.pathname.startsWith("/api/public/v1")) {
    if (!publicHandler) {
      return Response.json(
        {
          status: "configuration_required",
          service: "@clientpad/api-host",
          missing: missingConfig,
          message: "Public API is not configured yet.",
        },
        { status: 503 }
      );
    }
    return publicHandler(request);
  }

  return new Response("Not Found", { status: 404 });
}

export const config = {
  path: routes,
  preferStatic: false,
};
