import { describe, expect, it } from "vitest";
import { getChainConfig, listChains } from "../src/chains/index.js";

describe("chain registry", () => {
  it("loads required chain configs", () => {
    expect(getChainConfig("BASE_SEPOLIA")?.chainId).toBe(84532);
    expect(getChainConfig("BASE_MAINNET")?.chainId).toBe(8453);
    expect(getChainConfig("BNB_TESTNET")?.chainId).toBe(97);
    expect(getChainConfig("BNB_MAINNET")?.chainId).toBe(56);
    expect(getChainConfig("ETHEREUM_SEPOLIA")?.chainId).toBe(11155111);
    expect(getChainConfig("POLYGON_AMOY")?.chainId).toBe(80002);
    expect(getChainConfig("SOLANA_DEVNET")?.chainId).toBe("devnet");
    expect(getChainConfig("SOLANA_MAINNET")?.chainId).toBe("mainnet-beta");
    expect(getChainConfig("ENDLESS_TESTNET")?.chainId).toBe(221);
    expect(getChainConfig("ENDLESS_TESTNET")?.rpcUrl).toBeTruthy();
    expect(getChainConfig("ENDLESS_TESTNET")?.indexerUrl).toBe("https://idx-test.endless.link/api/v1");
    expect(getChainConfig("ENDLESS_MAINNET")?.chainId).toBe(220);
  });

  it("rejects unsupported chain lookups", () => {
    expect(getChainConfig("UNSUPPORTED_CHAIN")).toBeUndefined();
    expect(getChainConfig(999999)).toBeUndefined();
  });

  it("validates RPC URL exists when chain type is enabled", () => {
    const enabledTypes = new Set(
      [
        process.env.ENABLE_EVM === "false" ? undefined : "evm",
        process.env.ENABLE_SOLANA === "false" ? undefined : "solana",
        process.env.ENABLE_ENDLESS === "false" ? undefined : "endless",
      ].filter(Boolean),
    );

    for (const chain of listChains()) {
      if (enabledTypes.has(chain.chainType)) {
        expect(chain.rpcUrl.length).toBeGreaterThan(0);
      }
    }
  });
});
