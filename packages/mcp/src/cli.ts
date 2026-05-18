#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClientPadMcpServer, loadConfigFromEnv, logStartup, type ClientPadMcpLogger } from "./index.js";

const stderrLogger: ClientPadMcpLogger = {
  info: (message) => console.error(message),
  warn: (message) => console.error(message),
  error: (message) => console.error(message),
};

try {
  const config = loadConfigFromEnv();
  logStartup(config, stderrLogger);

  const server = createClientPadMcpServer({ config, logger: stderrLogger });
  const transport = new StdioServerTransport();

  process.on("SIGINT", () => {
    void shutdown(server, "SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown(server, "SIGTERM");
  });

  await server.connect(transport);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown startup error.";
  stderrLogger.error(`@clientpad/mcp startup failed: ${message}`);
  process.exit(1);
}

async function shutdown(server: { close(): Promise<void> }, signal: string) {
  stderrLogger.info(`@clientpad/mcp received ${signal}; shutting down`);
  await server.close();
  process.exit(0);
}
