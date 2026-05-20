const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

export async function onRequest({ request }) {
  const url = new URL(request.url);

  if (url.pathname === "/" || url.pathname === "/health") {
    return json({
      status: "ok",
      service: "clientpad-api",
      routes: {
        cloud: "/api/cloud/v1",
        public: "/api/public/v1",
      },
      time: new Date().toISOString(),
    });
  }

  if (
    url.pathname.startsWith("/api/cloud/v1") ||
    url.pathname.startsWith("/api/public/v1")
  ) {
    return json(
      {
        status: "configuration_required",
        message:
          "API runtime is deployed on Cloudflare, but backend database and secrets are not configured yet.",
        required: ["DATABASE_URL", "API_KEY_PEPPER", "CLIENTPAD_CLOUD_ADMIN_TOKEN"],
      },
      { status: 503 }
    );
  }

  return new Response("Not Found", { status: 404 });
}
