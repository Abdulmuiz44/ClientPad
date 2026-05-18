import assert from "node:assert/strict";
import { createClientPadMcpServer, loadConfigFromEnv } from "../dist/index.js";

const calls = [];

const client = {
  leads: {
    async list(params) {
      calls.push(["leads.list", params]);
      return { data: [], pagination: { limit: params.limit ?? 50, offset: params.offset ?? 0 } };
    },
    async create(input) {
      calls.push(["leads.create", input]);
      return { data: { id: "lead_1" } };
    },
  },
  clients: {
    async list(params) {
      calls.push(["clients.list", params]);
      return { data: [], pagination: { limit: params.limit ?? 50, offset: params.offset ?? 0 } };
    },
    async create(input) {
      calls.push(["clients.create", input]);
      return { data: { id: "client_1" } };
    },
  },
  usage: {
    async retrieve() {
      calls.push(["usage.retrieve", {}]);
      return {
        data: {
          api_key_id: "api_key_1",
          workspace_id: "workspace_1",
          billing_mode: "cloud_free",
          month: "2026-05-01",
          request_count: 12,
          rejected_count: 1,
          monthly_request_limit: 1000,
          remaining_requests: 988,
          rate_limit_per_minute: 60,
        },
      };
    },
  },
};

const logs = [];
const server = createClientPadMcpServer({
  client,
  config: { baseUrl: "https://example.com/api/public/v1", apiKey: "cp_test" },
  logger: {
    info: (message) => logs.push(["info", message]),
    warn: (message) => logs.push(["warn", message]),
    error: (message) => logs.push(["error", message]),
  },
});

const tools = Object.keys(server._registeredTools).sort();
assert.deepEqual(tools, [
  "clientpad_metadata",
  "clients_create",
  "clients_list",
  "leads_create",
  "leads_list",
  "usage_retrieve",
]);

const leadsList = await server._registeredTools.leads_list.handler({ limit: 10, offset: 5, status: "new" });
assert.deepEqual(calls.at(-1), ["leads.list", { limit: 10, offset: 5, status: "new" }]);
assert.deepEqual(leadsList.structuredContent, { data: [], pagination: { limit: 10, offset: 5 } });

const leadCreate = await server._registeredTools.leads_create.handler({
  name: "Ada Customer",
  phone: "+2348035550198",
  source: "",
});
assert.deepEqual(calls.at(-1), ["leads.create", { name: "Ada Customer", phone: "+2348035550198" }]);
assert.deepEqual(leadCreate.structuredContent, { data: { id: "lead_1" } });

const clientsList = await server._registeredTools.clients_list.handler({ q: "Ada", offset: 0 });
assert.deepEqual(calls.at(-1), ["clients.list", { q: "Ada", offset: 0 }]);
assert.equal(clientsList.structuredContent.pagination.offset, 0);

const clientsCreate = await server._registeredTools.clients_create.handler({
  business_name: "Ada Studio",
  email: "ada@example.com",
});
assert.deepEqual(calls.at(-1), ["clients.create", { business_name: "Ada Studio", email: "ada@example.com" }]);
assert.deepEqual(clientsCreate.structuredContent, { data: { id: "client_1" } });

const usage = await server._registeredTools.usage_retrieve.handler({});
assert.deepEqual(calls.at(-1), ["usage.retrieve", {}]);
assert.equal(usage.structuredContent.data.remaining_requests, 988);

const metadata = await server._registeredTools.clientpad_metadata.handler({});
assert.equal(metadata.structuredContent.data.auth, "api_key");
assert.equal(metadata.structuredContent.data.base_url, "https://example.com/api/public/v1");

assert.throws(() => loadConfigFromEnv({}), /CLIENTPAD_BASE_URL is required/);
assert.throws(() => loadConfigFromEnv({ CLIENTPAD_BASE_URL: "https://example.com" }), /CLIENTPAD_API_KEY is required/);
assert.ok(logs.some(([, message]) => message.includes("leads_list")));
