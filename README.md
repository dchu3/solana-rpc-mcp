# solana-rpc-mcp

A TypeScript MCP (Model Context Protocol) server that exposes the Solana JSON-RPC API for blockchain data queries.

## Installation

```bash
npm install
npm run build
```

## Usage

### As an MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "solana-rpc": {
      "command": "node",
      "args": ["/path/to/solana-rpc-mcp/dist/index.js"]
    }
  }
}
```

You can optionally set `SOLANA_RPC_URL` to use a dedicated provider endpoint. If not set, it defaults to `https://api.mainnet-beta.solana.com`.

## Tools

### Account Methods

#### getBalance
Get the SOL balance (in lamports) for a public key.
- `pubkey` (string, required): Base-58 encoded public key
- `commitment` (string, optional): finalized, confirmed, or processed

#### getAccountInfo
Get account info (owner, lamports, data) for a public key.
- `pubkey` (string, required): Base-58 encoded public key
- `commitment` (string, optional): Commitment level
- `encoding` (string, optional): base58, base64, or jsonParsed

#### getMultipleAccounts
Get account info for multiple public keys (up to 100).
- `pubkeys` (string, required): Comma-separated base-58 encoded public keys
- `commitment` (string, optional): Commitment level
- `encoding` (string, optional): Data encoding

#### getProgramAccounts
Get all accounts owned by a program.
- `programId` (string, required): Base-58 encoded program public key
- `commitment` (string, optional): Commitment level
- `encoding` (string, optional): Data encoding

### Transaction Methods

#### getTransaction
Get transaction details by signature.
- `signature` (string, required): Transaction signature (base-58)
- `commitment` (string, optional): Commitment level
- `maxSupportedTransactionVersion` (number, optional): Max version to return

#### getSignaturesForAddress
Get transaction signatures for an address (newest first).
- `address` (string, required): Base-58 encoded address
- `limit` (number, optional): Max signatures (1-1000, default: 1000)
- `before` (string, optional): Start searching backwards from this signature
- `commitment` (string, optional): Commitment level

#### getSignatureStatuses
Get the statuses of transaction signatures.
- `signatures` (string, required): Comma-separated transaction signatures
- `searchTransactionHistory` (boolean, optional): Search full history

### Block Methods

#### getBlock
Get block details by slot number.
- `slot` (number, required): Slot number
- `commitment` (string, optional): Commitment level
- `maxSupportedTransactionVersion` (number, optional): Max version to return

#### getBlockHeight
Get the current block height.
- `commitment` (string, optional): Commitment level

#### getLatestBlockhash
Get the latest blockhash.
- `commitment` (string, optional): Commitment level

#### getBlockTime
Get the estimated production time of a block (Unix timestamp).
- `slot` (number, required): Slot number

### Token Methods (SPL)

#### getTokenAccountBalance
Get the token balance of an SPL token account.
- `tokenAccount` (string, required): Base-58 encoded token account address
- `commitment` (string, optional): Commitment level

#### getTokenAccountsByOwner
Get all SPL token accounts owned by an address.
- `owner` (string, required): Base-58 encoded owner address
- `mint` (string, optional): Filter by mint address
- `programId` (string, optional): Filter by token program
- `commitment` (string, optional): Commitment level

#### getTokenSupply
Get the total supply of an SPL token.
- `mint` (string, required): Base-58 encoded mint address
- `commitment` (string, optional): Commitment level

#### getTokenLargestAccounts
Get the 20 largest accounts for an SPL token.
- `mint` (string, required): Base-58 encoded mint address
- `commitment` (string, optional): Commitment level

### Cluster Info Methods

#### getClusterNodes
Get information about all nodes in the cluster.
- No parameters

#### getEpochInfo
Get information about the current epoch.
- `commitment` (string, optional): Commitment level

#### getVersion
Get the current Solana version running on the node.
- No parameters

#### getHealth
Check if the node is healthy.
- No parameters

## API Reference

This server connects to the [Solana Mainnet RPC](https://api.mainnet-beta.solana.com). See the [Solana RPC Documentation](https://solana.com/docs/rpc) for more details.

## Rate Limits

The public Solana RPC endpoint has rate limits (~100 requests per 10 seconds). For heavy usage, consider using a dedicated RPC provider.
