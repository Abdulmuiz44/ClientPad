# ClientPad MCP

`@clientpad/mcp` is the Model Context Protocol server for ClientPad. It lets MCP-capable agents use ClientPad as a narrow, stable backend for lead, client, and usage operations.

The v1 server intentionally uses the public API through `@clientpad/sdk`. It does not connect directly to PostgreSQL, ClientPad Cloud admin routes, WhatsApp inbox controls, payments, or dashboard internals.

## Tools

- `leads_list`: list workspace leads with pagination and optional status filtering.
- `leads_create`: create a lead.
- `clients_list`: list clients with pagination and optional search.
- `clients_create`: create a client.
- `usage_retrieve`: retrieve the current API key usage summary.
- `clientpad_metadata`: describe the MCP server configuration without exposing secrets.

## Configuration

Required environment variables:

```bash
CLIENTPAD_BASE_URL=https://api.clientpad.xyz/api/public/v1
CLIENTPAD_API_KEY=cp_live_your_workspace_key
```

Optional:

```bash
CLIENTPAD_MCP_TIMEOUT_MS=15000
CLIENTPAD_MCP_DEBUG=1
```

`CLIENTPAD_API_KEY` must be a normal ClientPad public API key with scopes for the tools you want agents to use, such as `leads:read`, `leads:write`, `clients:read`, `clients:write`, and `usage:read`.

## Run

From this repository:

```bash
pnpm --filter @clientpad/mcp build
CLIENTPAD_BASE_URL=http://localhost:3000/api/public/v1 CLIENTPAD_API_KEY=cp_live_x pnpm --filter @clientpad/mcp exec clientpad-mcp
```

After publishing:

```bash
CLIENTPAD_BASE_URL=https://api.clientpad.xyz/api/public/v1 CLIENTPAD_API_KEY=cp_live_x npx @clientpad/mcp
```

## MCP client example

For a stdio-based MCP client, configure the command and pass credentials through environment variables:

```json
{
  "mcpServers": {
    "clientpad": {
      "command": "npx",
      "args": ["@clientpad/mcp"],
      "env": {
        "CLIENTPAD_BASE_URL": "https://api.clientpad.xyz/api/public/v1",
        "CLIENTPAD_API_KEY": "cp_live_your_workspace_key"
      }
    }
  }
}
```

## Local validation

```bash
pnpm --filter @clientpad/mcp typecheck
pnpm --filter @clientpad/mcp build
pnpm --filter @clientpad/mcp test
```

## v1 limitations

The v1 MCP surface is deliberately small. It avoids:

- WhatsApp inbox control
- payment orchestration
- dashboard or cloud admin mutations
- destructive operations
- direct database access
- broad experimental endpoints

Future MCP versions can add more tools after the corresponding public API surface is stable and documented.
