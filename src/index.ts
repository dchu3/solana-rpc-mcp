#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const FETCH_TIMEOUT_MS = 30000;

const server = new McpServer({
  name: "solana-rpc",
  version: "1.0.0",
});

type RpcResponse = { content: { type: "text"; text: string }[] };

let requestId = 0;

async function rpcCall(method: string, params: unknown[] = []): Promise<RpcResponse> {
  try {
    const response = await fetch(SOLANA_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++requestId,
        method,
        params,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { content: [{ type: "text" as const, text: `Error: ${response.status} ${response.statusText}` }] };
    }

    const data = await response.json();
    if (data.error) {
      return { content: [{ type: "text" as const, text: `RPC Error: ${JSON.stringify(data.error)}` }] };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(data.result, null, 2) }] };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { content: [{ type: "text" as const, text: `Error: Request timed out after ${FETCH_TIMEOUT_MS / 1000}s` }] };
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { content: [{ type: "text" as const, text: `Error: ${msg}` }] };
  }
}

const commitmentSchema = z.enum(["finalized", "confirmed", "processed"]).optional().describe("Commitment level (default: finalized)");

// ============ Account Methods ============

server.tool(
  "getBalance",
  "Get the SOL balance (in lamports) for a public key",
  {
    pubkey: z.string().describe("Base-58 encoded public key"),
    commitment: commitmentSchema,
  },
  async ({ pubkey, commitment }) => rpcCall("getBalance", commitment ? [pubkey, { commitment }] : [pubkey])
);

server.tool(
  "getAccountInfo",
  "Get account info for a public key (owner, lamports, data)",
  {
    pubkey: z.string().describe("Base-58 encoded public key"),
    commitment: commitmentSchema,
    encoding: z.enum(["base58", "base64", "jsonParsed"]).optional().describe("Data encoding (default: base64)"),
  },
  async ({ pubkey, commitment, encoding }) => {
    const config: Record<string, unknown> = {};
    if (commitment) config.commitment = commitment;
    if (encoding) config.encoding = encoding;
    return rpcCall("getAccountInfo", Object.keys(config).length ? [pubkey, config] : [pubkey]);
  }
);

server.tool(
  "getMultipleAccounts",
  "Get account info for multiple public keys (up to 100)",
  {
    pubkeys: z.string().describe("Comma-separated base-58 encoded public keys"),
    commitment: commitmentSchema,
    encoding: z.enum(["base58", "base64", "jsonParsed"]).optional().describe("Data encoding (default: base64)"),
  },
  async ({ pubkeys, commitment, encoding }) => {
    const keys = pubkeys.split(",").map((k) => k.trim());
    const config: Record<string, unknown> = {};
    if (commitment) config.commitment = commitment;
    if (encoding) config.encoding = encoding;
    return rpcCall("getMultipleAccounts", Object.keys(config).length ? [keys, config] : [keys]);
  }
);

server.tool(
  "getProgramAccounts",
  "Get all accounts owned by a program",
  {
    programId: z.string().describe("Base-58 encoded program public key"),
    commitment: commitmentSchema,
    encoding: z.enum(["base58", "base64", "jsonParsed"]).optional().describe("Data encoding (default: base64)"),
  },
  async ({ programId, commitment, encoding }) => {
    const config: Record<string, unknown> = {};
    if (commitment) config.commitment = commitment;
    if (encoding) config.encoding = encoding;
    return rpcCall("getProgramAccounts", Object.keys(config).length ? [programId, config] : [programId]);
  }
);

// ============ Transaction Methods ============

server.tool(
  "getTransaction",
  "Get transaction details by signature",
  {
    signature: z.string().describe("Transaction signature (base-58)"),
    commitment: commitmentSchema,
    maxSupportedTransactionVersion: z.number().optional().describe("Max transaction version to return (default: legacy only)"),
  },
  async ({ signature, commitment, maxSupportedTransactionVersion }) => {
    const config: Record<string, unknown> = { encoding: "jsonParsed" };
    if (commitment) config.commitment = commitment;
    if (maxSupportedTransactionVersion !== undefined) config.maxSupportedTransactionVersion = maxSupportedTransactionVersion;
    return rpcCall("getTransaction", [signature, config]);
  }
);

server.tool(
  "getSignaturesForAddress",
  "Get transaction signatures for an address (newest first)",
  {
    address: z.string().describe("Base-58 encoded address"),
    limit: z.number().optional().describe("Max signatures to return (1-1000, default: 1000)"),
    before: z.string().optional().describe("Start searching backwards from this signature"),
    commitment: commitmentSchema,
  },
  async ({ address, limit, before, commitment }) => {
    const config: Record<string, unknown> = {};
    if (limit) config.limit = limit;
    if (before) config.before = before;
    if (commitment) config.commitment = commitment;
    return rpcCall("getSignaturesForAddress", Object.keys(config).length ? [address, config] : [address]);
  }
);

server.tool(
  "getSignatureStatuses",
  "Get the statuses of transaction signatures",
  {
    signatures: z.string().describe("Comma-separated transaction signatures (base-58)"),
    searchTransactionHistory: z.boolean().optional().describe("Search full history (slower, default: false)"),
  },
  async ({ signatures, searchTransactionHistory }) => {
    const sigs = signatures.split(",").map((s) => s.trim());
    const config = searchTransactionHistory ? { searchTransactionHistory } : undefined;
    return rpcCall("getSignatureStatuses", config ? [sigs, config] : [sigs]);
  }
);

// ============ Block Methods ============

server.tool(
  "getBlock",
  "Get block details by slot number",
  {
    slot: z.number().describe("Slot number"),
    commitment: commitmentSchema,
    maxSupportedTransactionVersion: z.number().optional().describe("Max transaction version to return"),
  },
  async ({ slot, commitment, maxSupportedTransactionVersion }) => {
    const config: Record<string, unknown> = { encoding: "jsonParsed", transactionDetails: "full" };
    if (commitment) config.commitment = commitment;
    if (maxSupportedTransactionVersion !== undefined) config.maxSupportedTransactionVersion = maxSupportedTransactionVersion;
    return rpcCall("getBlock", [slot, config]);
  }
);

server.tool(
  "getBlockHeight",
  "Get the current block height",
  {
    commitment: commitmentSchema,
  },
  async ({ commitment }) => rpcCall("getBlockHeight", commitment ? [{ commitment }] : [])
);

server.tool(
  "getLatestBlockhash",
  "Get the latest blockhash",
  {
    commitment: commitmentSchema,
  },
  async ({ commitment }) => rpcCall("getLatestBlockhash", commitment ? [{ commitment }] : [])
);

server.tool(
  "getBlockTime",
  "Get the estimated production time of a block (Unix timestamp)",
  {
    slot: z.number().describe("Slot number"),
  },
  async ({ slot }) => rpcCall("getBlockTime", [slot])
);

// ============ Token Methods (SPL) ============

server.tool(
  "getTokenAccountBalance",
  "Get the token balance of an SPL token account",
  {
    tokenAccount: z.string().describe("Base-58 encoded token account address"),
    commitment: commitmentSchema,
  },
  async ({ tokenAccount, commitment }) => rpcCall("getTokenAccountBalance", commitment ? [tokenAccount, { commitment }] : [tokenAccount])
);

server.tool(
  "getTokenAccountsByOwner",
  "Get all SPL token accounts owned by an address",
  {
    owner: z.string().describe("Base-58 encoded owner address"),
    mint: z.string().optional().describe("Filter by mint address"),
    programId: z.string().optional().describe("Filter by token program (default: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)"),
    commitment: commitmentSchema,
  },
  async ({ owner, mint, programId, commitment }) => {
    const filter = mint ? { mint } : { programId: programId || "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" };
    const config: Record<string, unknown> = { encoding: "jsonParsed" };
    if (commitment) config.commitment = commitment;
    return rpcCall("getTokenAccountsByOwner", [owner, filter, config]);
  }
);

server.tool(
  "getTokenSupply",
  "Get the total supply of an SPL token",
  {
    mint: z.string().describe("Base-58 encoded mint address"),
    commitment: commitmentSchema,
  },
  async ({ mint, commitment }) => rpcCall("getTokenSupply", commitment ? [mint, { commitment }] : [mint])
);

server.tool(
  "getTokenLargestAccounts",
  "Get the 20 largest accounts for an SPL token",
  {
    mint: z.string().describe("Base-58 encoded mint address"),
    commitment: commitmentSchema,
  },
  async ({ mint, commitment }) => rpcCall("getTokenLargestAccounts", commitment ? [mint, { commitment }] : [mint])
);

// ============ Cluster Info Methods ============

server.tool(
  "getClusterNodes",
  "Get information about all nodes in the cluster",
  {},
  async () => rpcCall("getClusterNodes")
);

server.tool(
  "getEpochInfo",
  "Get information about the current epoch",
  {
    commitment: commitmentSchema,
  },
  async ({ commitment }) => rpcCall("getEpochInfo", commitment ? [{ commitment }] : [])
);

server.tool(
  "getVersion",
  "Get the current Solana version running on the node",
  {},
  async () => rpcCall("getVersion")
);

server.tool(
  "getHealth",
  "Check if the node is healthy",
  {},
  async () => rpcCall("getHealth")
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
