import type { ChainConfig, ChainKey, ChainType } from "./types.js";

const settlementMode = process.env.LAEL_SETTLEMENT_MODE ?? "mock";

export const CHAIN_REGISTRY: Record<ChainKey, ChainConfig> = {
  BASE_SEPOLIA: {
    chainKey: "BASE_SEPOLIA",
    chainId: 84532,
    chainType: "evm",
    rpcUrl: rpcUrl("base-sepolia", process.env.BASE_RPC_URL),
    explorerUrl: "https://sepolia.basescan.org",
    nativeCurrency: "ETH",
    testnet: true,
  },
  BASE_MAINNET: {
    chainKey: "BASE_MAINNET",
    chainId: 8453,
    chainType: "evm",
    rpcUrl: rpcUrl("base-mainnet", process.env.BASE_MAINNET_RPC_URL ?? process.env.BASE_RPC_URL),
    explorerUrl: "https://basescan.org",
    nativeCurrency: "ETH",
    testnet: false,
  },
  BNB_TESTNET: {
    chainKey: "BNB_TESTNET",
    chainId: 97,
    chainType: "evm",
    rpcUrl: rpcUrl("bnb-testnet", process.env.BNB_TESTNET_RPC_URL),
    explorerUrl: "https://testnet.bscscan.com",
    nativeCurrency: "tBNB",
    testnet: true,
  },
  BNB_MAINNET: {
    chainKey: "BNB_MAINNET",
    chainId: 56,
    chainType: "evm",
    rpcUrl: rpcUrl("bnb-mainnet", process.env.BNB_RPC_URL),
    explorerUrl: "https://bscscan.com",
    nativeCurrency: "BNB",
    testnet: false,
  },
  ETHEREUM_SEPOLIA: {
    chainKey: "ETHEREUM_SEPOLIA",
    chainId: 11155111,
    chainType: "evm",
    rpcUrl: rpcUrl("ethereum-sepolia", process.env.SEPOLIA_RPC_URL),
    explorerUrl: "https://sepolia.etherscan.io",
    nativeCurrency: "ETH",
    testnet: true,
  },
  POLYGON_AMOY: {
    chainKey: "POLYGON_AMOY",
    chainId: 80002,
    chainType: "evm",
    rpcUrl: rpcUrl("polygon-amoy", process.env.POLYGON_RPC_URL),
    explorerUrl: "https://amoy.polygonscan.com",
    nativeCurrency: "POL",
    testnet: true,
  },
  SOLANA_DEVNET: {
    chainKey: "SOLANA_DEVNET",
    chainId: "devnet",
    chainType: "solana",
    rpcUrl: rpcUrl("solana-devnet", process.env.SOLANA_RPC_URL, "https://api.devnet.solana.com"),
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
    nativeCurrency: "SOL",
    testnet: true,
  },
  SOLANA_MAINNET: {
    chainKey: "SOLANA_MAINNET",
    chainId: "mainnet-beta",
    chainType: "solana",
    rpcUrl: rpcUrl("solana-mainnet", process.env.SOLANA_MAINNET_RPC_URL, "https://solana-rpc.publicnode.com"),
    explorerUrl: "https://explorer.solana.com",
    nativeCurrency: "SOL",
    testnet: false,
  },
  ENDLESS_TESTNET: {
    chainKey: "ENDLESS_TESTNET",
    chainId: 221,
    chainType: "endless",
    rpcUrl: rpcUrl("endless-testnet", process.env.ENDLESS_TESTNET_RPC_URL ?? process.env.ENDLESS_RPC_URL, "https://rpc-test.endless.link/v1"),
    explorerUrl: "https://endless.link",
    indexerUrl: "https://idx-test.endless.link/api/v1",
    nativeCurrency: "EDS",
    testnet: true,
  },
  ENDLESS_MAINNET: {
    chainKey: "ENDLESS_MAINNET",
    chainId: 220,
    chainType: "endless",
    rpcUrl: rpcUrl("endless-mainnet", process.env.ENDLESS_MAINNET_RPC_URL, "https://rpc.endless.link/v1"),
    explorerUrl: "https://endless.link",
    indexerUrl: "https://idx.endless.link/api/v1",
    nativeCurrency: "EDS",
    testnet: false,
  },
};

function rpcUrl(mockName: string, configured: string | undefined, fallback?: string): string {
  if (settlementMode === "mock") {
    return `mock://${mockName}`;
  }
  return configured ?? fallback ?? `mock://${mockName}`;
}

export function listChains(): ChainConfig[] {
  return Object.values(CHAIN_REGISTRY);
}

export function getChainConfig(chainKeyOrId: ChainKey | string | number): ChainConfig | undefined {
  const direct = CHAIN_REGISTRY[String(chainKeyOrId) as ChainKey];
  if (direct) {
    return direct;
  }

  return Object.values(CHAIN_REGISTRY).find(
    (chain) => String(chain.chainId) === String(chainKeyOrId),
  );
}

export function getDefaultChainForType(chainType: ChainType): ChainConfig | undefined {
  return Object.values(CHAIN_REGISTRY).find((chain) => chain.chainType === chainType);
}
