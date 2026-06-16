export type ChainType = "evm" | "solana" | "endless";

export type ChainKey =
  | "BASE_SEPOLIA"
  | "BASE_MAINNET"
  | "BNB_TESTNET"
  | "BNB_MAINNET"
  | "ETHEREUM_SEPOLIA"
  | "POLYGON_AMOY"
  | "SOLANA_DEVNET"
  | "SOLANA_MAINNET"
  | "ENDLESS_TESTNET"
  | "ENDLESS_MAINNET";

export interface ChainConfig {
  chainKey: ChainKey;
  chainId: number | string;
  chainType: ChainType;
  rpcUrl: string;
  explorerUrl: string;
  indexerUrl?: string;
  nativeCurrency: string;
  testnet: boolean;
}
