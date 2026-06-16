import { describe, expect, it } from "vitest";
import {
  classifyEvidence,
  deriveLearningItems,
  deriveLoopSteps,
  type LoopModelInput,
} from "../src/frontend/app/loop-model.js";

describe("frontend execution loop model", () => {
  it("marks the off-chain runtime path as passed after a runtime receipt exists", () => {
    const steps = deriveLoopSteps({
      selectedLane: "offchain",
      hasRuntimeReceipt: true,
      bindingStatus: "bound",
    });

    expect(steps.find((step) => step.id === "execution-lane")).toMatchObject({
      status: "pass",
      detail: "Off-chain runtime receipt generated",
    });
    expect(steps.find((step) => step.id === "settlement-evidence")?.status).toBe("pass");
    expect(steps.find((step) => step.id === "learning")?.status).toBe("pass");
  });

  it("marks an on-chain transfer proposal as waiting for manual wallet confirmation", () => {
    const input: LoopModelInput = {
      selectedLane: "onchain-transfer",
      bindingStatus: "bound",
      proposalStatus: "allow_pending_human_confirmation",
      hasReceipt: false,
    };

    const steps = deriveLoopSteps(input);

    expect(steps.find((step) => step.id === "permission")?.status).toBe("manual_required");
    expect(steps.find((step) => step.id === "execution-lane")).toMatchObject({
      status: "manual_required",
      detail: "Wallet signature required",
    });
  });

  it("marks simulated swap execution as simulated instead of real on-chain settlement", () => {
    const steps = deriveLoopSteps({
      selectedLane: "onchain-swap",
      bindingStatus: "bound",
      swapProposalStatus: "allow_pending_human_confirmation",
      hasSwapReceipt: true,
    });

    expect(steps.find((step) => step.id === "execution-lane")).toMatchObject({
      status: "simulated",
      detail: "Swap simulated receipt generated",
    });
    expect(steps.find((step) => step.id === "settlement-evidence")?.status).toBe("simulated");
  });

  it("classifies evidence on-chain status and sensitivity", () => {
    expect(classifyEvidence({ txHash: "0xabc", receiptId: "exec_1" })).toMatchObject({
      onChainStatus: "On-chain tx",
      sensitivity: "Public",
      disclosure: "可公开",
    });
    expect(classifyEvidence({ rawInput: "帮我转账给 Alice", walletAddress: "0xabc" })).toMatchObject({
      onChainStatus: "Off-chain private log",
      sensitivity: "Sensitive",
      disclosure: "不建议披露",
    });
    expect(classifyEvidence({ traceDigest: "trace_1", simulated: true })).toMatchObject({
      onChainStatus: "Simulated proof",
      sensitivity: "Internal",
      disclosure: "仅内部",
    });
    expect(classifyEvidence({ appAuthorizationStatus: "rejected", executionMode: "sdk-ready" })).toMatchObject({
      onChainStatus: "Simulated proof",
      sensitivity: "Internal",
      disclosure: "仅内部",
    });
  });

  it("derives learning items with visible priority and safety boundaries", () => {
    const items = deriveLearningItems({
      feedbackSubmitted: true,
      memory: {
        userPreferences: {
          preferredRecipientName: "Alice",
          preferredAmount: 0.0001,
          preferredAsset: "ETH",
          preferredChainKey: "BASE_SEPOLIA",
        },
        agentScore: 0.55,
        feedbackCount: 1,
        policySuggestions: [{ type: "keep_confirmation", status: "pending", reason: "Human approval is required" }],
        trainingExamples: [{ rawInput: "再给 Alice 发一次测试奖励", exportAllowed: false }],
      },
    });

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          priority: "High",
          suggestion: expect.stringContaining("人工确认"),
        }),
        expect.objectContaining({
          priority: "Medium",
          content: expect.stringContaining("Alice"),
        }),
        expect.objectContaining({
          priority: "Optional",
          boundary: expect.stringContaining("不自动导出训练数据"),
        }),
      ]),
    );
  });
});
