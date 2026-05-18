import {
  ClientPad,
  ClientPadError,
  LEAD_STATUSES,
  type Client,
  type ClientPadConfig,
  type CreateClientInput,
  type CreateLeadInput,
  type Lead,
  type ListClientsParams,
  type ListLeadsParams,
  type PaginatedResponse,
} from "@clientpad/sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export type ClientPadMcpConfig = {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  debug?: boolean;
  fetch?: ClientPadConfig["fetch"];
};

export type ClientPadMcpServerOptions = {
  client?: ClientPad;
  config?: ClientPadMcpConfig;
  logger?: ClientPadMcpLogger;
};

export type ClientPadMcpLogger = Pick<Console, "error" | "info" | "warn">;

const PACKAGE_NAME = "@clientpad/mcp";
const PACKAGE_VERSION = "0.2.0";
const DEFAULT_TIMEOUT_MS = 15_000;

const leadStatusSchema = z.enum(LEAD_STATUSES);
const paginationInputSchema = {
  limit: z.number().int().min(1).max(100).optional().describe("Maximum records to return. Defaults to the API default."),
  offset: z.number().int().min(0).optional().describe("Number of records to skip. Defaults to 0."),
};

const leadSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  name: z.string(),
  phone: z.string(),
  source: z.string().nullable(),
  service_interest: z.string().nullable(),
  status: leadStatusSchema,
  owner_user_id: z.string().nullable(),
  next_follow_up_at: z.string().nullable(),
  urgency: z.string().nullable(),
  budget_clue: z.string().nullable(),
  notes: z.string().nullable(),
  intent: z.string().nullable(),
  ai_summary: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const clientSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  business_name: z.string(),
  primary_contact: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const createdIdSchema = z.object({
  data: z.object({
    id: z.string(),
  }),
});

const paginationSchema = z.object({
  limit: z.number(),
  offset: z.number(),
});

const usageSchema = z.object({
  data: z.object({
    api_key_id: z.string(),
    workspace_id: z.string(),
    billing_mode: z.enum(["self_hosted", "cloud_free", "cloud_paid", "cloud_enterprise"]),
    month: z.string(),
    request_count: z.number(),
    rejected_count: z.number(),
    monthly_request_limit: z.number().nullable(),
    remaining_requests: z.number().nullable(),
    rate_limit_per_minute: z.number().nullable(),
  }),
});

const metadataSchema = z.object({
  data: z.object({
    package: z.literal(PACKAGE_NAME),
    version: z.literal(PACKAGE_VERSION),
    base_url: z.string(),
    auth: z.literal("api_key"),
    tools: z.array(z.string()),
  }),
});

export const CLIENTPAD_MCP_TOOL_NAMES = [
  "leads_list",
  "leads_create",
  "clients_list",
  "clients_create",
  "usage_retrieve",
  "clientpad_metadata",
] as const;

export function createClientPadMcpServer(options: ClientPadMcpServerOptions = {}) {
  const logger = options.logger ?? console;
  const config = options.config;
  const client =
    options.client ??
    new ClientPad({
      baseUrl: requireNonEmpty(config?.baseUrl, "CLIENTPAD_BASE_URL"),
      apiKey: requireNonEmpty(config?.apiKey, "CLIENTPAD_API_KEY"),
      fetch: config?.fetch ?? createTimeoutFetch(config?.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });

  const server = new McpServer({
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
  });

  server.registerTool(
    "leads_list",
    {
      title: "List leads",
      description: "List workspace leads through the stable ClientPad public API.",
      inputSchema: {
        ...paginationInputSchema,
        status: leadStatusSchema.optional().describe("Optional lead status filter."),
      },
      outputSchema: {
        data: z.array(leadSchema),
        pagination: paginationSchema,
      },
    },
    async (input) => runTool("leads_list", logger, () => client.leads.list(cleanParams(input) as ListLeadsParams))
  );

  server.registerTool(
    "leads_create",
    {
      title: "Create lead",
      description: "Create a lead in the configured ClientPad workspace.",
      inputSchema: {
        name: z.string().trim().min(1).max(200).describe("Lead name."),
        phone: z.string().trim().min(1).max(64).describe("Lead phone number."),
        source: z.string().trim().max(120).optional().describe("Lead source, such as Website or WhatsApp."),
        service_interest: z.string().trim().max(200).optional().describe("Service the lead is interested in."),
        status: leadStatusSchema.optional().describe("Initial lead status."),
        next_follow_up_at: z.string().trim().max(80).optional().describe("ISO timestamp or date for the next follow-up."),
        urgency: z.string().trim().max(80).optional().describe("Short urgency signal."),
        budget_clue: z.string().trim().max(120).optional().describe("Budget signal or clue."),
        notes: z.string().trim().max(4000).optional().describe("Operator notes."),
        intent: z.string().trim().max(200).optional().describe("Detected or declared lead intent."),
        ai_summary: z.string().trim().max(4000).optional().describe("Short AI-generated lead summary."),
      },
      outputSchema: createdIdSchema.shape,
    },
    async (input) => runTool("leads_create", logger, () => client.leads.create(cleanParams(input) as CreateLeadInput))
  );

  server.registerTool(
    "clients_list",
    {
      title: "List clients",
      description: "List workspace clients through the stable ClientPad public API.",
      inputSchema: {
        ...paginationInputSchema,
        q: z.string().trim().max(200).optional().describe("Optional client search query."),
      },
      outputSchema: {
        data: z.array(clientSchema),
        pagination: paginationSchema,
      },
    },
    async (input) => runTool("clients_list", logger, () => client.clients.list(cleanParams(input) as ListClientsParams))
  );

  server.registerTool(
    "clients_create",
    {
      title: "Create client",
      description: "Create a client record in the configured ClientPad workspace.",
      inputSchema: {
        business_name: z.string().trim().min(1).max(240).describe("Business or client name."),
        primary_contact: z.string().trim().max(200).optional().describe("Primary contact person."),
        phone: z.string().trim().max(64).optional().describe("Client phone number."),
        email: z.string().trim().email().optional().describe("Client email address."),
        location: z.string().trim().max(240).optional().describe("Client location."),
        notes: z.string().trim().max(4000).optional().describe("Operator notes."),
      },
      outputSchema: createdIdSchema.shape,
    },
    async (input) =>
      runTool("clients_create", logger, () => client.clients.create(cleanParams(input) as CreateClientInput))
  );

  server.registerTool(
    "usage_retrieve",
    {
      title: "Retrieve usage",
      description: "Retrieve the current API key usage summary.",
      inputSchema: {},
      outputSchema: usageSchema.shape,
    },
    async () => runTool("usage_retrieve", logger, () => client.usage.retrieve())
  );

  server.registerTool(
    "clientpad_metadata",
    {
      title: "ClientPad MCP metadata",
      description: "Describe this MCP server without exposing secrets.",
      inputSchema: {},
      outputSchema: metadataSchema.shape,
    },
    async () =>
      runTool("clientpad_metadata", logger, async () => ({
        data: {
          package: PACKAGE_NAME,
          version: PACKAGE_VERSION,
          base_url: config?.baseUrl ? sanitizeBaseUrl(config.baseUrl) : "configured-client",
          auth: "api_key" as const,
          tools: [...CLIENTPAD_MCP_TOOL_NAMES],
        },
      }))
  );

  return server;
}

export function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ClientPadMcpConfig {
  return {
    baseUrl: requireNonEmpty(env.CLIENTPAD_BASE_URL, "CLIENTPAD_BASE_URL"),
    apiKey: requireNonEmpty(env.CLIENTPAD_API_KEY, "CLIENTPAD_API_KEY"),
    timeoutMs: parseTimeout(env.CLIENTPAD_MCP_TIMEOUT_MS),
    debug: env.CLIENTPAD_MCP_DEBUG === "1" || env.CLIENTPAD_MCP_DEBUG === "true",
  };
}

export function logStartup(config: ClientPadMcpConfig, logger: ClientPadMcpLogger = console) {
  logger.info(`${PACKAGE_NAME} ${PACKAGE_VERSION} starting with base URL ${sanitizeBaseUrl(config.baseUrl)}`);
  if (config.debug) logger.info(`${PACKAGE_NAME} debug logging enabled`);
}

async function runTool<T>(toolName: string, logger: ClientPadMcpLogger, operation: () => Promise<T>) {
  logger.info(`clientpad_mcp_tool_invoked tool=${toolName}`);
  try {
    const result = await operation();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result),
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  } catch (error) {
    const mapped = mapToolError(error);
    logger.warn(`clientpad_mcp_tool_failed tool=${toolName} category=${mapped.category} message=${mapped.message}`);
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(mapped),
        },
      ],
      structuredContent: { error: mapped },
    };
  }
}

function createTimeoutFetch(timeoutMs: number): ClientPadConfig["fetch"] {
  return async (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, {
        ...init,
        signal: init?.signal ?? controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  };
}

function mapToolError(error: unknown) {
  if (error instanceof ClientPadError) {
    return {
      category: error.status === 401 || error.status === 403 ? "auth" : "api",
      status: error.status,
      message: error.message,
    };
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      category: "timeout",
      message: "ClientPad API request timed out.",
    };
  }

  if (error instanceof TypeError) {
    return {
      category: "network",
      message: "ClientPad API request failed. Check CLIENTPAD_BASE_URL and network access.",
    };
  }

  if (error instanceof Error) {
    return {
      category: "unexpected",
      message: error.message,
    };
  }

  return {
    category: "unexpected",
    message: "Unexpected ClientPad MCP error.",
  };
}

function cleanParams<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function parseTimeout(value: string | undefined) {
  const timeout = Number(value ?? DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(timeout)) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.trunc(timeout), 1_000), 60_000);
}

function requireNonEmpty(value: string | undefined, name: string) {
  if (!value?.trim()) {
    throw new Error(`${name} is required to start the ClientPad MCP server.`);
  }
  return value.trim();
}

function sanitizeBaseUrl(baseUrl: string) {
  try {
    const url = new URL(baseUrl);
    url.username = "";
    url.password = "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return baseUrl.replace(/\/\/[^/\s@]+@/, "//").replace(/\/+$/, "");
  }
}
