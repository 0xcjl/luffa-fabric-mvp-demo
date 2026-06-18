import { afterEach, describe, expect, it, vi } from "vitest";
import { getChainConfig } from "../src/chains/index.js";
import { createDb } from "../src/db/index.js";
import { SettlementService } from "../src/settlement/index.js";
import {
  EndlessSettlementAdapter,
  EvmSettlementAdapter,
  SolanaSettlementAdapter,
} from "../src/settlement/adapters/index.js";
import type { SettlementAdapter, SettlementInstruction, SettlementTransferInput } from "../src/settlement/types.js";

const evmInput: SettlementTransferInput = {
  chainKey: "BASE_SEPOLIA",
  chainType: "evm",
  chainId: "84532",
  asset: "USDC",
  rail: "evm-erc20",
  amount: "1",
  fromAddress: "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
  toAddress: "0x0000000000000000000000000000000000000002",
  tokenAddress: "0x0000000000000000000000000000000000000003",
};

describe("settlement adapters", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("EVM adapter conforms to the settlement interface", async () => {
    const adapter = new EvmSettlementAdapter(requiredChain("BASE_SEPOLIA"));
    await expectAdapterConforms(adapter, evmInput);
  });

  it("Solana adapter conforms to the settlement interface", async () => {
    const adapter = new SolanaSettlementAdapter(requiredChain("SOLANA_DEVNET"));
    await expectAdapterConforms(adapter, {
      chainKey: "SOLANA_DEVNET",
      chainType: "solana",
      chainId: "devnet",
      asset: "SOL",
      rail: "solana-native",
      amount: "0.01",
      fromAddress: "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
      toAddress: "So11111111111111111111111111111111111111113",
    });
  });

  it("Endless adapter conforms to the settlement interface", async () => {
    const adapter = new EndlessSettlementAdapter(requiredChain("ENDLESS_TESTNET"));
    await expectAdapterConforms(adapter, {
      chainKey: "ENDLESS_TESTNET",
      chainType: "endless",
      chainId: "endless-testnet",
      asset: "LUFFA_POINTS",
      rail: "luffa-points",
      amount: "1",
      fromAddress: "did:luffa:payer",
      toAddress: "did:luffa:payee",
    });
  });

  it("Luffa Points settlement still works with rollback", () => {
    const db = createDb({ path: ":memory:" });
    const settlement = new SettlementService(db);
    settlement.createAccount("did:luffa:payer", "LUFFA_POINTS");
    settlement.credit("did:luffa:payer", "LUFFA_POINTS", 5);
    const completed = settlement.transfer({
      executionId: "exec_luffa_points",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "LUFFA_POINTS",
      amount: 3,
      rail: "luffa-points",
    });
    const rolledBack = settlement.transfer({
      executionId: "exec_luffa_rollback",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "LUFFA_POINTS",
      amount: 100,
      rail: "luffa-points",
    });

    expect(completed.status).toBe("COMPLETED");
    expect(rolledBack.status).toBe("ROLLED_BACK");
    expect(settlement.getBalance("did:luffa:payer", "LUFFA_POINTS")).toBe(2);
    expect(settlement.getBalance("did:luffa:payee", "LUFFA_POINTS")).toBe(3);
    db.close();
  });

  it("saves EVM native and ERC20 txHash records in mock mode", async () => {
    const db = createDb({ path: ":memory:" });
    const settlement = new SettlementService(db);
    settlement.registerDefaultAdapters();
    const native = await settlement.settle({
      executionId: "exec_native",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "ETH",
      amount: 0.001,
      rail: "evm-native",
      chainKey: "BASE_SEPOLIA",
      walletAddress: evmInput.fromAddress,
      toAddress: evmInput.toAddress,
    });
    const erc20 = await settlement.settle({
      executionId: "exec_erc20",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "USDC",
      amount: 1,
      rail: "evm-erc20",
      chainKey: "BASE_SEPOLIA",
      walletAddress: evmInput.fromAddress,
      toAddress: evmInput.toAddress,
      tokenAddress: evmInput.tokenAddress,
    });

    expect(native.txHash).toMatch(/^mock_/);
    expect(erc20.txHash).toMatch(/^mock_/);
    expect(settlement.getSettlementRecord(erc20.settlementId)?.txHash).toBe(erc20.txHash);
    expect((await settlement.verifyTransaction(erc20.txHash ?? "", "evm", "84532")).status).toBe("SUCCESS");
    db.close();
  });

  it("verifies Endless mainnet transactions against the requested chain id", async () => {
    const db = createDb({ path: ":memory:" });
    const settlement = new SettlementService(db);
    settlement.registerDefaultAdapters();
    const verification = await settlement.verifyTransaction(
      "G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid",
      "endless",
      "220",
    );

    expect(verification.status).toBe("SUCCESS");
    expect(verification.chainType).toBe("endless");
    expect(verification.chainId).toBe("220");
    db.close();
  });

  it("records BNB testnet wallet-provided txHash through the EVM rail", async () => {
    const db = createDb({ path: ":memory:" });
    const settlement = new SettlementService(db);
    settlement.registerDefaultAdapters();
    const bnb = await settlement.settle({
      executionId: "exec_bnb",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "BNB",
      amount: 0.001,
      rail: "evm-native",
      chainKey: "BNB_TESTNET",
      walletAddress: evmInput.fromAddress,
      toAddress: evmInput.toAddress,
      txHash: "0xbnbtesttx001",
      executionMode: "real",
      appAuthorizationStatus: "approved",
    });

    expect(bnb.status).toBe("COMPLETED");
    expect(bnb.chainType).toBe("evm");
    expect(bnb.chainId).toBe("97");
    expect(bnb.txHash).toBe("0xbnbtesttx001");
    expect(bnb.executionMode).toBe("real");
    expect(bnb.appAuthorizationStatus).toBe("approved");
    db.close();
  });

  it("rolls back ERC20 transfers with missing token address or forced mock failure", async () => {
    const db = createDb({ path: ":memory:" });
    const settlement = new SettlementService(db);
    settlement.registerDefaultAdapters();
    const missingToken = await settlement.settle({
      executionId: "exec_missing_token",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "USDC",
      amount: 1,
      rail: "evm-erc20",
      chainKey: "BASE_SEPOLIA",
      walletAddress: evmInput.fromAddress,
      toAddress: evmInput.toAddress,
    });
    const forcedFailure = await settlement.settle({
      executionId: "exec_forced_failure",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "USDC",
      amount: 1,
      rail: "evm-erc20",
      chainKey: "BASE_SEPOLIA",
      walletAddress: evmInput.fromAddress,
      toAddress: evmInput.toAddress,
      tokenAddress: evmInput.tokenAddress,
      metadata: { forceFail: true },
    });

    expect(missingToken.status).toBe("ROLLED_BACK");
    expect(forcedFailure.status).toBe("ROLLED_BACK");
    db.close();
  });

  it("settles SOL and SPL transfers in mock mode", async () => {
    const db = createDb({ path: ":memory:" });
    const settlement = new SettlementService(db);
    settlement.registerDefaultAdapters();
    const sol = await settlement.settle({
      executionId: "exec_sol",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "SOL",
      amount: 0.01,
      rail: "solana-native",
      chainKey: "SOLANA_DEVNET",
      walletAddress: "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
      toAddress: "So11111111111111111111111111111111111111113",
    });
    const spl = await settlement.settle({
      executionId: "exec_spl",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "SPL_TOKEN",
      amount: 2,
      rail: "solana-spl",
      chainKey: "SOLANA_DEVNET",
      walletAddress: "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
      toAddress: "So11111111111111111111111111111111111111113",
      tokenAddress: "MockSplTokenMint111111111111111111111111111111",
    });

    expect(sol.txHash).toMatch(/^mock_/);
    expect(spl.txHash).toMatch(/^mock_/);
    expect((await settlement.verifyTransaction(sol.txHash ?? "", "solana", "devnet")).status).toBe("SUCCESS");
    db.close();
  });

  it("keeps Solana wallet-provided txHash pending when RPC cannot find the signature", async () => {
    vi.stubEnv("LAEL_SETTLEMENT_MODE", "real");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ result: { value: [null] } }),
      })),
    );

    const adapter = new SolanaSettlementAdapter({
      ...requiredChain("SOLANA_MAINNET"),
      rpcUrl: "https://unit.test/solana",
    });
    const pending = await adapter.transfer({
      chainKey: "SOLANA_MAINNET",
      chainType: "solana",
      chainId: "mainnet-beta",
      asset: "SOL",
      amount: "0.000001",
      rail: "solana-native",
      fromAddress: "CDP7oDAHNKPRuEFo5VqhrtSyhQwWiEScj91hyepJAiSC",
      toAddress: "CDP7oDAHNKPRuEFo5VqhrtSyhQwWiEScj91hyepJAiSC",
      txHash: "not_found_signature_for_unit_test",
      executionMode: "real",
      appAuthorizationStatus: "approved",
    });

    expect(pending.status).toBe("PENDING");
    expect(pending.txHash).toBe("not_found_signature_for_unit_test");
    expect(pending.chainType).toBe("solana");
    expect(pending.executionMode).toBe("real");
  });

  it("records Endless Luffa App authorization outcomes", async () => {
    const db = createDb({ path: ":memory:" });
    const settlement = new SettlementService(db);
    settlement.registerDefaultAdapters();
    const approved = await settlement.settle({
      executionId: "exec_endless_approved",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "EDS",
      amount: 1,
      rail: "endless-native",
      chainKey: "ENDLESS_TESTNET",
      walletAddress: "0x0000000000000000000000000000000000000000000000000000000000000001",
      toAddress: "0x0000000000000000000000000000000000000000000000000000000000000002",
      txHash: "0xendlesstesttx001",
      executionMode: "app-authorized",
      appAuthorizationStatus: "approved",
    });
    const rejected = await settlement.settle({
      executionId: "exec_endless_rejected",
      payerDid: "did:luffa:payer",
      payeeDid: "did:luffa:payee",
      asset: "EDS",
      amount: 1,
      rail: "endless-native",
      chainKey: "ENDLESS_TESTNET",
      walletAddress: "0x0000000000000000000000000000000000000000000000000000000000000001",
      toAddress: "0x0000000000000000000000000000000000000000000000000000000000000002",
      executionMode: "sdk-ready",
      appAuthorizationStatus: "rejected",
    });

    expect(approved.status).toBe("COMPLETED");
    expect(approved.chainType).toBe("endless");
    expect(approved.chainId).toBe("221");
    expect(approved.txHash).toBe("0xendlesstesttx001");
    expect(approved.executionMode).toBe("app-authorized");
    expect(rejected.status).toBe("FAILED");
    expect(rejected.appAuthorizationStatus).toBe("rejected");
    db.close();
  });

  it("records fiat and invoice proof settlements without external payment rails", async () => {
    const db = createDb({ path: ":memory:" });
    const settlement = new SettlementService(db);

    const fiat = await settlement.settle({
      executionId: "exec_fiat_proof",
      payerDid: "did:luffa:user",
      payeeDid: "did:luffa:agent:invoice",
      amount: 25,
      asset: "FIAT_USD",
      rail: "fiat-proof",
      metadata: {
        reference: "stripe-test-proof-001",
        purpose: "Agent service invoice",
      },
    });
    const invoice = await settlement.settle({
      executionId: "exec_invoice_proof",
      payerDid: "did:luffa:user",
      payeeDid: "did:luffa:agent:invoice",
      amount: 25,
      asset: "FIAT_USD",
      rail: "invoice-proof",
      metadata: {
        reference: "invoice-001",
        purpose: "Agent service invoice",
      },
    });

    expect(fiat.status).toBe("COMPLETED");
    expect(fiat.transactionRef).toBe("fiat-proof:stripe-test-proof-001");
    expect(fiat.txHash).toBeUndefined();
    expect(invoice.status).toBe("COMPLETED");
    expect(invoice.transactionRef).toBe("invoice-proof:invoice-001");
    db.close();
  });

  it("does not leak adapter libraries into LAEL core", async () => {
    const { readFile } = await import("node:fs/promises");
    const core = await readFile(new URL("../src/core/index.ts", import.meta.url), "utf8");
    expect(core).not.toContain("viem");
    expect(core).not.toContain("ethers");
    expect(core).not.toContain("@solana/web3.js");
    expect(core).not.toContain("EvmSettlementAdapter");
    expect(core).not.toContain("SolanaSettlementAdapter");
  });
});

async function expectAdapterConforms(
  adapter: SettlementAdapter,
  input: SettlementTransferInput,
): Promise<void> {
  await expect(adapter.getBalance(input.fromAddress)).resolves.toMatch(/^\d+$/);
  await expect(adapter.estimateFee(input)).resolves.toMatch(/^\d+$/);
  const result = await adapter.transfer(input);
  expect(result.txHash).toBeTruthy();
  expect(result.chainType).toBe(adapter.chainType);
  const verification = await adapter.verifyTransaction(result.txHash);
  expect(["SUCCESS", "PENDING", "NOT_FOUND"]).toContain(verification.status);
}

function requiredChain(key: SettlementInstruction["chainKey"]) {
  const chain = getChainConfig(key ?? "");
  if (!chain) {
    throw new Error(`Missing test chain ${key}`);
  }
  return chain;
}
