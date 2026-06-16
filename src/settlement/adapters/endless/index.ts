import type { ChainConfig } from "../../../chains/types.js";
import { createMockTxHash } from "../common.js";
import type {
  SettlementAdapter,
  SettlementTransferInput,
  SettlementTransferResult,
  TransactionVerification,
} from "../../types.js";

export class EndlessSettlementAdapter implements SettlementAdapter {
  readonly chainType = "endless" as const;

  constructor(private readonly chain: ChainConfig) {}

  async getBalance(): Promise<string> {
    return "0";
  }

  async transfer(input: SettlementTransferInput): Promise<SettlementTransferResult> {
    const txHash = input.txHash ?? createMockTxHash({ adapter: "endless", input });
    const authorizationStatus = input.appAuthorizationStatus ?? (input.txHash ? "approved" : "simulated");
    const executionMode = input.executionMode ?? (input.txHash ? "app-authorized" : "sdk-ready");
    return {
      status: authorizationStatus === "rejected" || authorizationStatus === "unavailable" ? "FAILED" : "COMPLETED",
      txHash,
      chainType: this.chainType,
      chainId: String(this.chain.chainId),
      appAuthorizationStatus: authorizationStatus,
      executionMode,
      raw: {
        mode: executionMode,
        rail: "luffa-wallet-proxy-reserved",
        appAuthorizationStatus: authorizationStatus,
      },
    };
  }

  async verifyTransaction(txHash: string): Promise<TransactionVerification> {
    if (!txHash) {
      return {
        txHash,
        chainType: this.chainType,
        chainId: String(this.chain.chainId),
        status: "NOT_FOUND",
      };
    }
    if (this.chain.rpcUrl.startsWith("mock://") || txHash.startsWith("mock_")) {
      return {
        txHash,
        chainType: this.chainType,
        chainId: String(this.chain.chainId),
        status: "SUCCESS",
        raw: {
          mode: "adapter-abstraction",
        },
      };
    }

    try {
      const response = await fetch(`${this.chain.rpcUrl.replace(/\/$/, "")}/transactions/by_hash/${txHash}`);
      if (response.status === 404) {
        return {
          txHash,
          chainType: this.chainType,
          chainId: String(this.chain.chainId),
          status: "NOT_FOUND",
        };
      }
      const body = (await response.json()) as { success?: boolean; version?: string; vm_status?: string };
      return {
        txHash,
        chainType: this.chainType,
        chainId: String(this.chain.chainId),
        status: body.success === false ? "FAILED" : "SUCCESS",
        blockNumber: body.version ? Number(body.version) : undefined,
        raw: body as Record<string, unknown>,
      };
    } catch (error) {
      return {
        txHash,
        chainType: this.chainType,
        chainId: String(this.chain.chainId),
        status: "UNKNOWN",
        raw: {
          error: error instanceof Error ? error.message : "Endless transaction verification failed",
        },
      };
    }
  }

  async estimateFee(): Promise<string> {
    return "0";
  }
}
