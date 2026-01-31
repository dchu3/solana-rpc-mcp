# Copilot Instructions for solana-rpc-mcp

## Build Commands

```bash
npm install      # Install dependencies
npm run build    # Compile TypeScript to dist/
npm run start    # Run the MCP server
```

## Architecture

This is a Model Context Protocol (MCP) server wrapping the Solana JSON-RPC API. The entire implementation lives in a single file:

- **`src/index.ts`** - MCP server setup, JSON-RPC helper (`rpcCall`), and 19 tool definitions

The server uses `@modelcontextprotocol/sdk` and communicates via stdio transport. Each tool wraps a Solana RPC method.

## Key Conventions

### Tool Registration Pattern

Tools are registered using `server.tool()` with four arguments:
1. Tool name (camelCase, matching Solana RPC method names)
2. Description string
3. Zod schema object for parameters
4. Async handler that calls `rpcCall()`

### JSON-RPC Helper

All tools use `rpcCall(method, params)` which:
- Sends POST requests to Solana mainnet RPC
- Handles JSON-RPC 2.0 format with auto-incrementing IDs
- Returns MCP-formatted responses with JSON-stringified results
- Returns errors in the same format (not thrown)

### Commitment Parameter

Most read methods accept an optional `commitment` level:
- `finalized` (default) - Most secure, confirmed by supermajority
- `confirmed` - Faster, voted on by supermajority
- `processed` - Fastest, may be rolled back

### Rate Limits

Public Solana RPC: ~100 requests per 10 seconds. Heavy usage should use a dedicated RPC provider.
