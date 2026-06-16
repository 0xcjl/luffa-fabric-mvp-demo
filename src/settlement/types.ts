import type { ChainKey, ChainType } from "../chains/types.js";

export type SettlementAsset =
  | "LUFFA_POINTS"
  | "FIAT_USD"
  | "ETH"
  | "USDC"
  | "USDT"
  | "BNB"
  | "SOL"
  | "SPL_TOKEN"
  | "EDS";

export type SettlementRail =
  | "luffa-points"
  | "fiat-proof"
  | "invoice-proof"
  | "resource-credit"
  | "onofframp-intent"
  | "evm-native"
  | "evm-erc20"
  | "solana-native"
  | "solana-spl"
  | "endless-native";

export type WalletAuthorizationStatus = "approved" | "rejected" | "unavailable" | "simulated";
export type SettlementExecutionMode = "real" | "simulated" | "sdk-ready" | "app-authorized";

export type SettlementStatus = "PENDING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";

export interface SettlementInstruction {
  settlementId?: string;
  executionId: string;
  payerDid: string;
  payeeDid: string;
  asset: SettlementAsset;
  amount: number;
  rail: SettlementRail;
  chainKey?: ChainKey;
  chainType?: ChainType;
  chainId?: string;
  fromAddress?: string;
  toAddress?: string;
  walletAddress?: string;
  tokenAddress?: string;
  txHash?: string;
  signedTransaction?: string;
  appAuthorizationStatus?: WalletAuthorizationStatus;
  executionMode?: SettlementExecutionMode;
  metadata?: Record<string, unknown>;
  schemaVersion?: string;
  apiVersion?: string;
}

export interface SettlementRecord {
  settlementId: string;
  executionId: string;
  payerDid: string;
  payeeDid: string;
  asset: SettlementAsset;
  amount: number;
  rail: SettlementRail;
  status: SettlementStatus;
  transactionRef?: string;
  chainType?: ChainType;
  chainId?: string;
  txHash?: string;
  walletAddress?: string;
  gasUsed?: string;
  blockNumber?: number;
  appAuthorizationStatus?: WalletAuthorizationStatus;
  executionMode?: SettlementExecutionMode;
  createdAt: string;
  schemaVersion: string;
  apiVersion: string;
}

export interface SettlementTransferInput {
  settlementId?: string;
  chainKey?: ChainKey;
  chainType: ChainType;
  chainId: string;
  asset: SettlementAsset;
  rail: SettlementRail;
  amount: string;
  fromAddress: string;
  toAddress: string;
  tokenAddress?: string;
  txHash?: string;
  signedTransaction?: string;
  appAuthorizationStatus?: WalletAuthorizationStatus;
  executionMode?: SettlementExecutionMode;
  metadata?: Record<string, unknown>;
}

export interface SettlementTransferResult {
  status: SettlementStatus;
  txHash: string;
  chainType: ChainType;
  chainId: string;
  gasUsed?: string;
  blockNumber?: number;
  appAuthorizationStatus?: WalletAuthorizationStatus;
  executionMode?: SettlementExecutionMode;
  raw?: Record<string, unknown>;
}

export interface TransactionVerification {
  txHash: string;
  chainType: ChainType;
  chainId?: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "NOT_FOUND" | "UNKNOWN";
  gasUsed?: string;
  blockNumber?: number;
  confirmations?: number;
  raw?: Record<string, unknown>;
}

export interface SettlementAdapter {
  chainType: ChainType;
  getBalance(address: string): Promise<string>;
  transfer(input: SettlementTransferInput): Promise<SettlementTransferResult>;
  verifyTransaction(txHash: string): Promise<TransactionVerification>;
  estimateFee(input: SettlementTransferInput): Promise<string>;
}
