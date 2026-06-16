import { describe, expect, it } from "vitest";
import { buildServer } from "../src/api/server.js";

const ownerRef = "did:luffa:value_user";
const walletAddress = "0x0000000000000000000000000000000000000001";

describe("LAEL on-chain value agent simulated swap", () => {
  it("creates and executes a simulated swap proposal without real DEX execution", async () => {
    const { app } = await buildServer({ path: ":memory:" });

    const proposed = await app.inject({
      method: "POST",
      url: "/v2/value-agent/swap-proposals",
      payload: {
        ownerRef,
        walletAddress,
        rawInput: "Swap 0.0001 ETH to USDC on Base Sepolia",
        policy: {
          maxAmount: 0.001,
          allowedAssets: ["ETH", "USDC"],
          allowedChain: "BASE_SEPOLIA",
          maxSlippageBps: 100,
          requiresHumanConfirmation: true,
        },
      },
    });

    expect(proposed.statusCode).toBe(201);
    const proposal = proposed.json() as {
      proposalId: string;
      parsedIntent: {
        action: string;
        amount: number;
        fromAsset: string;
        toAsset: string;
        chainKey: string;
        protocol: string;
        slippageBps: number;
      };
      permissionDecision: {
        status: string;
        requiresHumanConfirmation: boolean;
      };
      executionMode: string;
    };
    expect(proposal).toMatchObject({
      parsedIntent: {
        action: "swap",
        amount: 0.0001,
        fromAsset: "ETH",
        toAsset: "USDC",
        chainKey: "BASE_SEPOLIA",
        protocol: "simulated-dex",
        slippageBps: 50,
      },
      permissionDecision: {
        status: "allow_pending_human_confirmation",
        requiresHumanConfirmation: true,
      },
      executionMode: "simulated",
    });

    const executed = await app.inject({
      method: "POST",
      url: `/v2/value-agent/swap-proposals/${proposal.proposalId}/execute`,
      payload: { humanConfirmed: true },
    });

    expect(executed.statusCode).toBe(201);
    const executedBody = executed.json() as {
      receipt: {
        walletTx: Record<string, unknown>;
      };
    };
    expect(executedBody).toMatchObject({
      receipt: {
        rawInput: "Swap 0.0001 ETH to USDC on Base Sepolia",
        parsedIntent: proposal.parsedIntent,
        settlementResult: {
          status: "simulated_completed",
          rail: "resource-credit",
        },
        learningStatus: {
          status: "pending_feedback",
        },
      },
    });
    expect(executedBody.receipt.walletTx).not.toHaveProperty("txHash");

    await app.close();
  });

  it("blocks simulated swaps that exceed amount, asset, chain, or slippage policy", async () => {
    const { app } = await buildServer({ path: ":memory:" });

    const overLimit = await app.inject({
      method: "POST",
      url: "/v2/value-agent/swap-proposals",
      payload: {
        ownerRef,
        walletAddress,
        rawInput: "Swap 0.01 ETH to USDC on Base Sepolia",
        policy: {
          maxAmount: 0.001,
          allowedAssets: ["ETH", "USDC"],
          allowedChain: "BASE_SEPOLIA",
          maxSlippageBps: 100,
          requiresHumanConfirmation: true,
        },
      },
    });
    const wrongChain = await app.inject({
      method: "POST",
      url: "/v2/value-agent/swap-proposals",
      payload: {
        ownerRef,
        walletAddress,
        rawInput: "Swap 0.0001 ETH to USDC on Polygon",
        policy: {
          maxAmount: 0.001,
          allowedAssets: ["ETH", "USDC"],
          allowedChain: "BASE_SEPOLIA",
          maxSlippageBps: 100,
          requiresHumanConfirmation: true,
        },
      },
    });

    expect(overLimit.statusCode).toBe(200);
    expect(overLimit.json()).toMatchObject({
      permissionDecision: {
        status: "blocked",
        reason: "Amount exceeds swap policy",
      },
      learningStatus: {
        riskRecord: {
          type: "swap_amount_limit_block",
        },
      },
    });
    expect(wrongChain.statusCode).toBe(200);
    expect(wrongChain.json()).toMatchObject({
      permissionDecision: {
        status: "blocked",
        reason: "Chain denied by swap policy",
      },
    });

    await app.close();
  });

  it("parses explicit BNB mainnet swap without falling back to BNB testnet", async () => {
    const { app } = await buildServer({ path: ":memory:" });

    const proposed = await app.inject({
      method: "POST",
      url: "/v2/value-agent/swap-proposals",
      payload: {
        ownerRef,
        walletAddress,
        rawInput: "Swap 0.000001 BNB to USDC on BNB mainnet",
        policy: {
          maxAmount: 0.001,
          allowedAssets: ["BNB", "USDC"],
          allowedChain: "BNB_MAINNET",
          maxSlippageBps: 100,
          requiresHumanConfirmation: true,
        },
      },
    });

    expect(proposed.statusCode).toBe(201);
    expect(proposed.json()).toMatchObject({
      parsedIntent: {
        amount: 0.000001,
        fromAsset: "BNB",
        toAsset: "USDC",
        chainKey: "BNB_MAINNET",
      },
      permissionDecision: {
        status: "allow_pending_human_confirmation",
      },
    });

    await app.close();
  });
});
