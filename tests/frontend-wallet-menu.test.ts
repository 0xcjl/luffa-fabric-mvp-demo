import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/frontend/app/page.tsx", "utf8");
const providers = readFileSync("src/frontend/app/providers.tsx", "utf8");
const envExample = readFileSync("src/frontend/.env.local.example", "utf8");

describe("frontend wallet menu", () => {
  it("shows common wallet names without WalletConnect or Project ID copy", () => {
    expect(page).toContain("MetaMask / OKX Wallet");
    expect(page).toContain("Use OKX / MetaMask / Rabby / Phantom");
    expect(page).toContain("Phantom / Solana Wallet");
    expect(page).toContain("Use Phantom / OKX");
    expect(providers).toContain('id: "okx"');
    expect(providers).toContain('id: "rabby"');
    expect(providers).toContain('injected({ target: "metaMask" })');
    expect(providers).toContain('injected({ target: "phantom" })');
    expect(page).toContain('const EVM_CONNECTOR_PRIORITY = ["okx", "metaMask", "rabby", "phantom", "injected"]');
    expect(page).toContain("selectPreferredEvmConnector(connectors)");
    expect(page).toContain("Disconnecting current EVM connector");
    expect(page).toContain("Requesting EVM wallet connection with");
    expect(page).toContain("Using existing OKX Wallet EVM connector");
    expect(page).toContain("ensureVerifiedWalletBindingForExecution");
    expect(page).toContain("Verified wallet binding found for");
    expect(page).toContain("Wallet binding required before LAEL receipt recording");
    expect(page).not.toContain("WalletConnect");
    expect(page).not.toContain("Project ID");
    expect(envExample).not.toContain("WalletConnect");
    expect(envExample).not.toContain("Project ID");
    expect(providers).not.toContain("walletConnect");
  });

  it("lists mainnet and testnet lanes and protects mainnet execution", () => {
    for (const chainKey of [
      "BASE_SEPOLIA",
      "BASE_MAINNET",
      "BNB_TESTNET",
      "BNB_MAINNET",
      "SOLANA_DEVNET",
      "SOLANA_MAINNET",
      "ENDLESS_TESTNET",
      "ENDLESS_MAINNET",
    ]) {
      expect(page).toContain(chainKey);
    }

    expect(page).toContain("Mainnet real execution is gated; explicit env and user confirmation required.");
    expect(page).toContain("const DEFAULT_MAINNET_MAX_AMOUNT_ETH = 0.001");
    expect(page).toContain('const PUBLIC_DEMO_API_BASE = "https://luffa-fabric-mvp-api.onrender.com"');
    expect(page).toContain("Runtime config fallback used: mainnet=true cap=0.001 callback=https://luffa-fabric-mvp-api.onrender.com");
    expect(page).toContain("Loading runtime config before wallet signing.");
    expect(page).toContain("Runtime config loaded from Render API");
    expect(page).toContain("Check / Wake API");
    expect(page).toContain('refreshRuntimeConfig("manual")');
  });

  it("handles Solana selection and Endless bridge absence without runtime overlay errors", () => {
    expect(page).toContain("useWalletModal");
    expect(page).toContain("setSolanaWalletModalVisible(true)");
    expect(page).toContain("findPhantomWalletAdapter(solanaWallet.wallets)");
    expect(page).toContain("getOkxSolanaProvider()");
    expect(page).toContain("Phantom not found; choose another Solana wallet");
    expect(page).toContain("OKX Solana provider does not support signTransaction");
    expect(providers).toContain("autoConnect={false}");
    expect(page).toContain("Connecting Endless Web Wallet");
    expect(page).toContain("Use Luffa App");
    expect(page).toContain("connectLuffaAppNetwork");
    expect(page).toContain('void createEndlessQrSession(nextChain, null, "login")');
    expect(page).toContain("Using Endless Web Wallet SDK in this browser");
    expect(page).toContain("Prepare a 0.000001 SOL transfer proposal to Alice on Solana mainnet");
    expect(page).toContain("reward ${amount} SOL to Alice on Solana ${chain.networkKind}");
    expect(page).toContain("connection.getBalance(sender");
    expect(page).toContain("connection.getFeeForMessage(transaction.compileMessage()");
    expect(page).toContain("SOLANA_SELF_TRANSFER_PLACEHOLDERS");
    expect(page).toContain("Using connected Solana wallet as the mainnet self-transfer recipient");
    expect(page).toContain("proposal still uses placeholder recipient");
    expect(page).toContain("solanaWallet.signTransaction");
    expect(page).toContain("connection.sendRawTransaction");
    expect(page).toContain("recordExecutionReceiptWithTxHash(signature, \"Solana\")");
    expect(page).toContain("Solana transaction confirmed:");
    expect(page).toContain("Solana signer check: connectedAddress=");
    expect(page).toContain("signed with a different account than the connected sender");
    expect(page).toContain("Insufficient Solana ${selectedChain.networkKind} balance");
    expect(page).toContain("Solana tx payload: endpoint=");
    expect(page).toContain("SOLANA_FEE_FALLBACK_LAMPORTS");
    expect(page).toContain("SOLANA_MAINNET_FALLBACK_ENDPOINT");
    expect(page).toContain("solanaEndpointsForChain");
    expect(page).toContain("Solana RPC unavailable for ${selectedChain.label}");
    expect(page).toContain("Solana transaction request failed");
    expect(page).toContain("Copy local enable command");
    expect(page).toContain("Public demo keeps this off");
  });

  it("keeps the Solana signature visible immediately after submission and before confirmation", () => {
    const signStart = page.indexOf("async function signWalletTransaction()");
    const solanaBody = page.slice(
      page.indexOf('if (selectedChain.chainType === "solana")', signStart),
      page.indexOf('if (!(await ensureSelectedEvmConnected(selectedChain)))', signStart),
    );
    expect(solanaBody).toContain("const signature = await connection.sendRawTransaction");
    expect(solanaBody).toContain("setTxHash(signature)");
    expect(solanaBody).toContain("Solana transaction submitted:");
    expect(solanaBody).toContain("Solana confirmation pending");
    expect(solanaBody).toContain("Retry Confirm available");
    expect(solanaBody).toContain("confirmSolanaSignature(signature");
    expect(solanaBody.indexOf("setTxHash(signature)")).toBeLessThan(solanaBody.indexOf("confirmSolanaSignature(signature"));
    expect(solanaBody.indexOf("recordExecutionReceiptWithTxHash(signature, \"Solana\")")).toBeGreaterThan(solanaBody.indexOf("if (!confirmation.ok)"));
  });

  it("exposes Base mainnet guard and repeatable on-chain manual tests", () => {
    expect(page).toContain("LAEL_ENABLE_MAINNET_EXECUTION");
    expect(page).toContain("Base Mainnet small-value transfer");
    expect(page).toContain("Base Sepolia acceptance");
    expect(page).toContain("Endless QR authorization");
    expect(page).toContain("mainnetRiskAccepted");
  });

  it("exposes signed Luffa App authorization and task reward controls", () => {
    expect(page).toContain("luffa-endless-auth");
    expect(page).toContain("signatureVerified");
    expect(page).toContain("protocol_mock");
    expect(page).toContain("webview_bridge");
    expect(page).toContain("@endlesslab/endless-web3-sdk");
    expect(page).toContain("EndlessJsSdk");
    expect(page).toContain("sdk.open()");
    expect(page).toContain("hideEndlessWebWalletModal");
    expect(page).toContain('modal.style.removeProperty("display")');
    expect(page).toContain("modal.classList.add(ENDLESS_MODAL_HIDDEN_CLASS)");
    expect(page).not.toContain('display: "flex"');
    expect(page).toContain("AccountAddress.fromBs58String");
    expect(page).toContain("new TypeTagAddress()");
    expect(page).toContain("new TypeTagU128()");
    expect(page).toContain("signAndSubmitTransaction");
    expect(page).toContain("Endless Web Wallet submitted real tx");
    expect(page).toContain("Endless stage: opening sdk");
    expect(page).toContain("Endless stage: requesting account");
    expect(page).toContain("Endless stage: checking balance");
    expect(page).toContain("Endless stage: requesting transaction confirmation");
    expect(page).toContain("Endless stage: waiting txHash");
    expect(page).toContain("Endless stage: recording receipt");
    expect(page).toContain("recordExecutionReceiptWithTxHash(hash, \"Endless Web Wallet\")");
    expect(page).toContain("endless-web-wallet");
    expect(page).toContain("Task Reward");
    expect(page).toContain("businessAction");
    expect(page).toContain("Endless ${chain.networkKind}");
    expect(page).toContain("reward 0.001 EDS to Alice with Endless Web Wallet on Endless ${chain.networkKind}");
    expect(page).toContain('const ALICE_ENDLESS_ADDRESS = "6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw"');
    expect(page).toContain("effectiveRecipientAddressForChain(selectedChain, recipientAddress, activeSolanaAddress)");
    expect(page).toContain("Using Alice's fixed Endless address for this real-chain reward validation.");
    expect(page).toContain("ENDLESS_TX_OPTIONS");
    expect(page).toContain("ENDLESS_WALLET_RESPONSE_TIMEOUT_MS");
    expect(page).toContain("Endless Web Wallet transaction confirmation timed out");
    expect(page).toContain("Endless Web Wallet window failed to load. Check access to https://wallet.endless.link/wallet/ or use Luffa App QR. Retry available.");
    expect(page).toContain("Endless stage: window loaded");
    expect(page).toContain("getAccountEDSAmount");
    expect(page).toContain("Insufficient Endless ${selectedChain.networkKind} EDS balance");
    expect(page).toContain("options,");
    expect(page).toContain("Endless tx payload: sender=");
    expect(page).toContain("functionArguments: [recipient, amountUnits.toString()]");
    expect(page).toContain("A real Endless transaction requires a Luffa / Endless recipient address");
    expect(page).toContain('max: selectedChain.chainType === "endless" ? "0.001" : maxAmount');
    expect(page).not.toContain("reward 1 EDS to Alice with Luffa App on Endless testnet");
    expect(page).not.toContain("reward 1 EDS to Alice with Luffa App on Endless ${chain.networkKind}");
    expect(page).toContain('businessAction: isLogin ? "login"');
    expect(page).toContain('"Connect Luffa App wallet to LAEL DID"');
    expect(page).toContain("void bindEndlessWallet(nextChain)");
    expect(page).toContain("Scan with Luffa App");
    expect(page).toContain("Endless QR ${endlessQrSession.status}");
    expect(page).toContain("QR session:");
    expect(page).toContain("Luffa App Authorization");
    expect(page).toContain("Sign Endless Web Wallet Tx");
    expect(page).toContain("(!isEndlessLane && !walletConnected && !solanaRetryConfirmAvailable)");
    const signWalletTransactionBody = page.slice(
      page.indexOf("async function signWalletTransaction()"),
      page.indexOf("async function executeProposal()"),
    );
    expect(signWalletTransactionBody.indexOf('selectedChain.chainType === "endless"')).toBeLessThan(signWalletTransactionBody.indexOf("const mainnetBlock = getMainnetExecutionBlock"));
    const executeProposalBody = page.slice(
      page.indexOf("async function executeProposal()"),
      page.indexOf("function cancelProposal()"),
    );
    expect(executeProposalBody).toContain("Endless Web Wallet tx or signed Luffa App authorization required before recording receipt");
    expect(executeProposalBody).toContain("await createEndlessQrSession(selectedChain, proposal)");
    expect(executeProposalBody).toContain("Real Endless execution requires a real txHash from Endless Web Wallet or Luffa App");
    expect(executeProposalBody).toContain("Real ${selectedChain.label} receipt requires a real wallet txHash before Approve & Record");
    expect(executeProposalBody).toContain("isMockTxHash(effectiveTxHash)");
    expect(executeProposalBody).toContain('selectedChain.chainType === "endless" && endlessApproved ? undefined : getMainnetExecutionBlock');
    expect(executeProposalBody).toContain('appAuthorizationStatus: selectedChain.chainType === "endless" ? "approved"');
    expect(page).toContain("matchingSession");
    expect(page).toContain("Endless QR approved; record the receipt evidence next");
    expect(page).toContain("Open QR");
    expect(page).toContain("endlessQrSession.scanUrl");
    expect(page).toContain("Scan URL");
    expect(page).toContain("LAEL_PUBLIC_CALLBACK_BASE_URL");
    expect(page).toContain("Public callback");
    expect(page).toContain("Tunnel rule");
    expect(page).toContain("DEFAULT_RUNTIME_CONFIG");
    expect(page).toContain("Restart API and generate a new QR after tunnel URL changes");
  });

  it("shows feedback submission state to avoid silent duplicate clicks", () => {
    expect(page).toContain("Feedback submitted");
    expect(page).toContain("Submitting Feedback");
    expect(page).toContain("feedbackSubmitting");
    expect(page).toContain("approved without txHash");
    expect(page).toContain("Transaction signed and receipt recorded");
    expect(page).toContain("Retry Record available");
    expect(page).toContain("Existing receipt is stale; retry with txHash");
    expect(page).toContain("is preserved, but LAEL receipt recording is waiting for verified wallet binding");
    expect(page).toContain("Retry Record");
    expect(page).toContain("Recorded");
    expect(page).toContain("receiptHasTxHash");
    expect(page).toContain("human confirmation preserved");
  });

  it("merges feedback learning status without replacing wallet receipt metadata", () => {
    expect(page).toContain("setReceipt((current)");
    expect(page).toContain("...current.receipt");
    expect(page).toContain("feedback: nextLearning.receipt.feedback");
    expect(page).toContain("learningStatus: nextLearning.receipt.learningStatus");
    expect(page).toContain("current.executionId === receipt.executionId");
  });
});
