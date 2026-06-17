import type { FastifyInstance } from "fastify";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { LAEL } from "../core/index.js";
import type { ExecutionRequest } from "../execution/types.js";
import { EndlessQrSessionService } from "../endless-qr/index.js";
import type { CreateEndlessQrSessionInput, EndlessQrCallbackInput, EndlessQrSession } from "../endless-qr/index.js";
import type { RegisterAgentInput, UpdateAgentMetadataInput } from "../identity/types.js";
import type { CreatePolicyInput } from "../permission/types.js";
import { PaymentAgentMvpService } from "../payment-agent/index.js";
import type {
  CreatePaymentProposalInput,
  ExecutePaymentProposalInput,
  SubmitPaymentFeedbackInput,
} from "../payment-agent/index.js";
import type { SettlementInstruction } from "../settlement/types.js";
import { qaRunnerEnabled, runQaChecks, type QaRun } from "../qa-runner/index.js";
import { ValueAgentMvpService } from "../value-agent/index.js";
import type { CreateSwapProposalInput, ExecuteSwapProposalInput } from "../value-agent/index.js";
import type { ConnectWalletInput, VerifyWalletInput } from "../wallet/index.js";

export async function registerRoutes(app: FastifyInstance, lael: LAEL): Promise<void> {
  const paymentAgent = new PaymentAgentMvpService(lael);
  const valueAgent = new ValueAgentMvpService(lael);
  const endlessQr = new EndlessQrSessionService();
  const endlessQrDebugEvents = new Map<string, Array<{ createdAt: string; stage: string; debug: string }>>();
  const qaRuns = new Map<string, QaRun>();

  app.post("/v1/agents/register", async (request, reply) => {
    const agent = await lael.registerAgent(request.body as RegisterAgentInput);
    return reply.code(201).send({
      agentId: agent.internalId,
      status: agent.status,
      capabilities: agent.capabilities,
      publicKey: agent.publicKey,
      profile: agent,
    });
  });

  app.get("/v1/agents/:agentId", async (request, reply) => {
    const params = request.params as { agentId: string };
    try {
      return await lael.resolveAgent(params.agentId);
    } catch {
      return reply.code(404).send({ error: "Agent not found" });
    }
  });

  app.patch("/v1/agents/:agentId/metadata", async (request, reply) => {
    const params = request.params as { agentId: string };
    try {
      return await lael.updateAgentMetadata(
        params.agentId,
        request.body as UpdateAgentMetadataInput,
      );
    } catch {
      return reply.code(404).send({ error: "Agent not found" });
    }
  });

  app.post("/v1/agents/:agentId/deactivate", async (request, reply) => {
    const params = request.params as { agentId: string };
    try {
      return await lael.deactivateAgent(params.agentId);
    } catch {
      return reply.code(404).send({ error: "Agent not found" });
    }
  });

  app.post("/v1/policies", async (request, reply) => {
    const policy = await lael.createPolicy(request.body as CreatePolicyInput);
    return reply.code(201).send(policy);
  });

  app.post("/v1/agent/invoke", async (request) => {
    const result = await lael.invoke(request.body as ExecutionRequest);
    return {
      executionId: result.executionId,
      status: result.status,
      result: result.result,
      settlementStatus: result.settlementStatus?.toLowerCase(),
      merkleRoot: result.merkleRoot,
      idempotent: result.idempotent ?? false,
    };
  });

  app.get("/v1/executions/:executionId", async (request, reply) => {
    const params = request.params as { executionId: string };
    const record = lael.getExecutionRecord(params.executionId);
    if (!record) {
      return reply.code(404).send({ error: "Execution not found" });
    }
    return record;
  });

  app.post("/v1/executions/:executionId/feedback", async (request, reply) => {
    const params = request.params as { executionId: string };
    const body = request.body as { score: number; comment?: string };
    const reputation = lael.submitFeedback(params.executionId, body.score, body.comment);
    return reply.code(201).send(reputation);
  });

  app.get("/v1/agents/:agentId/reputation", async (request) => {
    const params = request.params as { agentId: string };
    return lael.getReputation(params.agentId);
  });

  app.get("/v1/accounts/:did/balance", async (request) => {
    const params = request.params as { did: string };
    return {
      did: params.did,
      asset: "LUFFA_POINTS",
      balance: lael.getBalance(params.did),
    };
  });

  app.get("/v2/chains", async () => ({
    chains: lael.getSupportedChains(),
  }));

  app.get("/v2/runtime-config", async () => ({
    mainnetExecutionEnabled: process.env.LAEL_ENABLE_MAINNET_EXECUTION !== "false",
    mainnetEnvVar: "LAEL_ENABLE_MAINNET_EXECUTION",
    mainnetMaxAmountEth: Number(process.env.LAEL_MAINNET_MAX_AMOUNT_ETH ?? 0.00001),
    publicCallback: publicCallbackRuntimeConfig(),
  }));

  app.post("/v2/wallet/connect", async (request, reply) => {
    try {
      return reply.code(201).send(lael.connectWallet(request.body as ConnectWalletInput));
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Wallet connect failed",
      });
    }
  });

  app.post("/v2/wallet/verify", async (request, reply) => {
    try {
      const binding = await lael.verifyWallet(request.body as VerifyWalletInput);
      return reply.code(binding.verified ? 200 : 400).send(binding);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Wallet verification failed",
      });
    }
  });

  app.get("/v2/wallets/:ownerRef", async (request) => {
    const params = request.params as { ownerRef: string };
    return { ownerRef: params.ownerRef, wallets: lael.getWallets(params.ownerRef) };
  });

  app.post("/v2/endless/qr-sessions", async (request, reply) => {
    try {
      return reply
        .code(201)
        .send(endlessQr.create(request.body as CreateEndlessQrSessionInput));
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Endless QR session creation failed",
      });
    }
  });

  app.get("/v2/endless/qr-sessions/:sessionId", async (request, reply) => {
    const params = request.params as { sessionId: string };
    const session = endlessQr.get(params.sessionId);
    if (!session) {
      return reply.code(404).send({ error: "Endless QR session not found" });
    }
    return session;
  });

  app.get("/v2/endless/qr-sessions/:sessionId/debug", async (request, reply) => {
    const params = request.params as { sessionId: string };
    const session = endlessQr.get(params.sessionId);
    if (!session) {
      return reply.code(404).send({ error: "Endless QR session not found" });
    }
    return {
      sessionId: params.sessionId,
      events: endlessQrDebugEvents.get(params.sessionId) ?? [],
    };
  });

  app.post("/v2/endless/qr-sessions/:sessionId/debug", async (request, reply) => {
    const params = request.params as { sessionId: string };
    const session = endlessQr.get(params.sessionId);
    if (!session) {
      return reply.code(404).send({ error: "Endless QR session not found" });
    }
    const body = request.body as { stage?: string; debug?: string };
    const event = {
      createdAt: new Date().toISOString(),
      stage: String(body.stage ?? "unknown").slice(0, 80),
      debug: String(body.debug ?? "").slice(0, 20000),
    };
    const events = [...(endlessQrDebugEvents.get(params.sessionId) ?? []), event].slice(-30);
    endlessQrDebugEvents.set(params.sessionId, events);
    request.log.info({ sessionId: params.sessionId, stage: event.stage, debug: event.debug }, "endless QR WebView debug event");
    return reply.code(201).send({ ok: true, eventCount: events.length });
  });

  app.post("/v2/endless/qr-sessions/:sessionId/claim", async (request, reply) => {
    const params = request.params as { sessionId: string };
    try {
      const claim = endlessQr.claim(params.sessionId);
      request.log.info({ sessionId: params.sessionId, claimId: claim.claimId }, "endless QR authorization claim accepted");
      return reply.code(201).send({ sessionId: params.sessionId, ...claim });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Endless QR authorization claim failed";
      const statusCode = message.includes("not found") ? 404 : message.includes("in progress") ? 409 : 400;
      return reply.code(statusCode).send({ error: message });
    }
  });

  app.get("/v2/endless/qr-sessions/:sessionId/scan", async (request, reply) => {
    const params = request.params as { sessionId: string };
    const session = endlessQr.get(params.sessionId);
    if (!session) {
      return reply.code(404).type("text/html").send(renderEndlessScanPage(undefined, "Endless QR session not found"));
    }
    return reply.type("text/html").send(renderEndlessScanPage(session));
  });

  app.post("/v2/endless/qr-sessions/:sessionId/build-transaction", async (request, reply) => {
    const params = request.params as { sessionId: string };
    const session = endlessQr.get(params.sessionId);
    if (!session) {
      return reply.code(404).send({ error: "Endless QR session not found" });
    }
    if (session.status !== "waiting") {
      return reply.code(400).send({ error: "Endless QR session is not waiting for authorization" });
    }
    if (session.businessAction === "login") {
      return reply.code(400).send({ error: "Login sessions do not build value transactions" });
    }
    const body = request.body as { senderAddress?: string };
    try {
      const builtTransaction = await buildEndlessTransferTransaction({
        senderAddress: String(body.senderAddress ?? ""),
        recipientAddress: session.recipientAddress,
        amount: session.amount,
        chainKey: session.chainKey,
      });
      return {
        sessionId: session.sessionId,
        senderAddress: body.senderAddress,
        senderHexAddress: builtTransaction.senderHexAddress,
        serializedTransaction: builtTransaction.serializedTransaction,
      };
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Endless transaction build failed",
      });
    }
  });

  app.post("/v2/endless/qr-sessions/:sessionId/callback", async (request, reply) => {
    const params = request.params as { sessionId: string };
    try {
      return await endlessQr.applyCallback(
        params.sessionId,
        request.body as EndlessQrCallbackInput,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Endless QR callback failed";
      return reply
        .code(message.includes("not found") ? 404 : 400)
        .send({ error: message });
    }
  });

  app.post("/v2/settlement/transfer", async (request, reply) => {
    try {
      const settlement = await lael.transferSettlement(
        request.body as SettlementInstruction & { idempotencyKey?: string },
      );
      return reply.code(settlement.status === "ROLLED_BACK" ? 409 : 201).send(settlement);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Settlement transfer failed",
      });
    }
  });

  app.get("/v2/settlement/tx/:txHash", async (request, reply) => {
    const params = request.params as { txHash: string };
    const query = request.query as { chainType?: SettlementInstruction["chainType"]; chainId?: string };
    try {
      return await lael.verifyTransaction(params.txHash, query.chainType, query.chainId);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Transaction verification failed",
      });
    }
  });

  app.post("/v2/payment-agent/proposals", async (request, reply) => {
    const proposal = await paymentAgent.createProposal(
      request.body as CreatePaymentProposalInput,
    );
    return reply
      .code(proposal.permissionDecision.status === "blocked" ? 200 : 201)
      .send(proposal);
  });

  app.post("/v2/payment-agent/proposals/:proposalId/execute", async (request, reply) => {
    const params = request.params as { proposalId: string };
    try {
      const result = await paymentAgent.executeProposal(
        params.proposalId,
        request.body as ExecutePaymentProposalInput,
      );
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Payment proposal execution failed",
      });
    }
  });

  app.post("/v2/payment-agent/receipts/:executionId/feedback", async (request, reply) => {
    const params = request.params as { executionId: string };
    try {
      const result = paymentAgent.submitFeedback(
        params.executionId,
        request.body as SubmitPaymentFeedbackInput,
      );
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Payment feedback failed",
      });
    }
  });

  app.get("/v2/payment-agent/memory/:ownerRef", async (request) => {
    const params = request.params as { ownerRef: string };
    return paymentAgent.getVisibleMemory(params.ownerRef);
  });

  app.post("/v2/value-agent/swap-proposals", async (request, reply) => {
    const proposal = valueAgent.createSwapProposal(request.body as CreateSwapProposalInput);
    return reply
      .code(proposal.permissionDecision.status === "blocked" ? 200 : 201)
      .send(proposal);
  });

  app.post("/v2/value-agent/swap-proposals/:proposalId/execute", async (request, reply) => {
    const params = request.params as { proposalId: string };
    try {
      const result = await valueAgent.executeSwapProposal(
        params.proposalId,
        request.body as ExecuteSwapProposalInput,
      );
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Swap proposal execution failed",
      });
    }
  });

  app.post("/v2/qa/runs", async (request, reply) => {
    if (!qaRunnerEnabled()) {
      return reply.code(403).send({
        status: "disabled",
        message: "Local QA runner is disabled on this API. Public demo deployments keep it off for safety; run the local API with ENABLE_LAEL_QA_RUNNER=true or npm run start:local to use full automated checks.",
      });
    }
    if (!isLocalQaRequest(request)) {
      return reply.code(403).send({
        status: "blocked",
        message: "Local QA runner only accepts localhost requests",
      });
    }
    const run = await runQaChecks({ cwd: process.cwd() });
    qaRuns.set(run.runId, run);
    return reply.code(201).send(run);
  });

  app.get("/v2/qa/runs/:runId", async (request, reply) => {
    const params = request.params as { runId: string };
    const run = qaRuns.get(params.runId);
    if (!run) {
      return reply.code(404).send({ error: "QA run not found" });
    }
    return run;
  });
}

function isLocalQaRequest(request: { ip: string; headers: Record<string, string | string[] | undefined> }): boolean {
  if (!isLocalRequest(request.ip)) return false;
  return !hasForwardedClientHeader(request.headers);
}

function isLocalRequest(ip: string): boolean {
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}

function hasForwardedClientHeader(headers: Record<string, string | string[] | undefined>): boolean {
  return Boolean(
    headers["cf-connecting-ip"] ||
      headers["x-forwarded-for"] ||
      headers["x-real-ip"] ||
      headers["true-client-ip"],
  );
}

function publicCallbackRuntimeConfig(): {
  envVar: "LAEL_PUBLIC_CALLBACK_BASE_URL";
  baseUrl: string | null;
  configured: boolean;
  localOnly: boolean;
  requirement: string;
  restartRequired: boolean;
  oldQrInvalidAfterChange: boolean;
} {
  const baseUrl = process.env.LAEL_PUBLIC_CALLBACK_BASE_URL?.trim().replace(/\/+$/, "") ?? "";
  return {
    envVar: "LAEL_PUBLIC_CALLBACK_BASE_URL",
    baseUrl: baseUrl || null,
    configured: Boolean(baseUrl),
    localOnly: !baseUrl,
    requirement: "Real Luffa App QR/WebView authorization requires a reachable HTTPS tunnel such as Cloudflare Tunnel; local-only callback is protocol/dev only.",
    restartRequired: true,
    oldQrInvalidAfterChange: true,
  };
}

async function buildEndlessTransferTransaction(input: {
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  chainKey: string;
}): Promise<{ serializedTransaction: string; senderHexAddress: string }> {
  if (!input.senderAddress || input.senderAddress.startsWith("0x")) {
    throw new Error("Endless transaction sender must be the Luffa App account address from connect()");
  }
  if (!input.recipientAddress || input.recipientAddress.startsWith("0x")) {
    throw new Error("Endless transaction recipient must be a Luffa / Endless account address");
  }
  const sdkPath = pathToFileURL(
    join(process.cwd(), "src/frontend/node_modules/@endlesslab/endless-ts-sdk/dist/esm/index.mjs"),
  ).href;
  const sdk = await import(sdkPath) as {
    Endless: new (config: unknown) => {
      transaction: {
        build: {
          simple: (input: unknown) => Promise<{ bcsToHex: () => { toString: () => string } }>;
        };
      };
    };
    EndlessConfig: new (input: { network: unknown }) => unknown;
    Network: { TESTNET: unknown; MAINNET: unknown };
    AccountAddress: { fromBs58String: (value: string) => unknown };
    TypeTagAddress: new () => unknown;
    TypeTagU128: new () => unknown;
  };
  const network = input.chainKey === "ENDLESS_MAINNET" ? sdk.Network.MAINNET : sdk.Network.TESTNET;
  const endless = new sdk.Endless(new sdk.EndlessConfig({ network }));
  const amountBaseUnits = BigInt(Math.max(1, Math.round(input.amount * 1e8)));
  const senderAddress = sdk.AccountAddress.fromBs58String(input.senderAddress);
  const transaction = await endless.transaction.build.simple({
    sender: senderAddress,
    data: {
      function: "0x1::endless_account::transfer",
      functionArguments: [
        sdk.AccountAddress.fromBs58String(input.recipientAddress),
        amountBaseUnits,
      ],
      abi: {
        typeParameters: [],
        parameters: [new sdk.TypeTagAddress(), new sdk.TypeTagU128()],
      },
    },
  });
  return {
    senderHexAddress: String(senderAddress),
    serializedTransaction: transaction.bcsToHex().toString(),
  };
}

function renderEndlessScanPage(session?: EndlessQrSession, error?: string): string {
  const sessionJson = JSON.stringify(session ?? null).replace(/</g, "\\u003c");
  const errorJson = JSON.stringify(error ?? "").replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Luffa App Authorization</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; background: #eef4f2; color: #10201b; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 20px; box-sizing: border-box; }
      section { width: min(100%, 520px); background: white; border: 1px solid #b7c7bf; border-radius: 12px; padding: 18px; box-shadow: 0 18px 45px rgba(16, 32, 27, 0.16); }
      h1 { margin: 0; font-size: 22px; line-height: 1.2; }
      p { color: #41524b; line-height: 1.5; }
      dl { display: grid; gap: 10px; margin: 18px 0; }
      div.row { border: 1px solid #d8e2dd; border-radius: 8px; padding: 10px; overflow-wrap: anywhere; }
      dt { font-size: 11px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; color: #66756f; }
      dd { margin: 4px 0 0; font-size: 14px; font-weight: 800; }
      button { width: 100%; border: 0; border-radius: 8px; padding: 13px 14px; background: #126bff; color: white; font-size: 15px; font-weight: 900; }
      button:disabled { opacity: .5; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #f6f8f7; border-radius: 8px; padding: 10px; font-size: 12px; }
      .status { margin-top: 12px; font-size: 13px; font-weight: 800; color: #41524b; }
      .error { color: #b42318; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Luffa App Authorization</h1>
        <p>Confirm in Luffa App to sign the authorization and return receipt evidence to LAEL.</p>
        <dl id="summary"></dl>
        <button id="approve" type="button">Sign With Luffa App</button>
        <div class="status" id="status">Waiting for Luffa App WebView bridge.</div>
        <pre id="debug"></pre>
      </section>
    </main>
    <script>
      const session = ${sessionJson};
      const loadError = ${errorJson};
      const statusEl = document.getElementById("status");
      const debugEl = document.getElementById("debug");
      const approveBtn = document.getElementById("approve");
      const summaryEl = document.getElementById("summary");
      const callbacks = {};
      let currentAccountAddress = "";
      const appSigningMessage = session?.signingMessage?.split("\\n").join(" | ") ?? "";
      const terminalSession = Boolean(session && session.status !== "waiting");
      const storageKey = session ? "lael:endless-auth:" + session.sessionId : "";
      const localLockKey = session ? "lael:endless-auth-lock:" + session.sessionId : "";
      let approveStarted = false;

      function setStatus(message, isError = false) {
        statusEl.textContent = message;
        statusEl.className = isError ? "status error" : "status";
      }

      let lastBridgeDebug = null;

      function formatDebug(value) {
        try {
          return JSON.stringify(value, null, 2).replace(/https?:\\/\\//g, (match) => match.replace("://", "[:]//"));
        } catch (error) {
          return String(value).replace(/https?:\\/\\//g, (match) => match.replace("://", "[:]//"));
        }
      }

      function setDebug(value) {
        const debug = formatDebug(value);
        debugEl.textContent = debug;
        sendDebug("ui_debug", debug);
      }

      function sendDebug(stage, debug) {
        if (!session?.sessionId) return;
        fetch("/v2/endless/qr-sessions/" + encodeURIComponent(session.sessionId) + "/debug", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            stage,
            debug: String(debug).slice(0, 20000),
          }),
        }).catch(() => {});
      }

      function hasBridge() {
        return Boolean(window._endlessWallet || window.webkit?.messageHandlers?._endlessWallet);
      }

      function sendLuffaMessage(message) {
        if (window._endlessWallet?.sendMessage) {
          window._endlessWallet.sendMessage(JSON.stringify(message));
          return true;
        }
        if (window.webkit?.messageHandlers?._endlessWallet?.postMessage) {
          window.webkit.messageHandlers._endlessWallet.postMessage(message);
          return true;
        }
        return false;
      }

      function normalizeResponse(raw) {
        const response = parseBridgeResponse(raw);
        return response?.data ?? response?.args ?? response?.result ?? response;
      }

      function parseBridgeResponse(raw) {
        if (typeof raw !== "string") return raw;
        try {
          return JSON.parse(raw);
        } catch (error) {
          debugEl.textContent = String(raw).replace(/https?:\\/\\//g, (match) => match.replace("://", "[:]//"));
          throw error;
        }
      }

      function pickField(source, names) {
        if (!source || typeof source !== "object") return undefined;
        if (Array.isArray(source)) {
          for (const item of source) {
            const value = pickField(item, names);
            if (value) return value;
          }
          return undefined;
        }
        for (const name of names) {
          const value = source[name];
          if (typeof value === "string" && value.length > 0) return value;
          if (typeof value === "number") return String(value);
        }
        for (const nestedKey of ["data", "args", "result", "payload"]) {
          const value = pickField(source[nestedKey], names);
          if (value) return value;
        }
        return undefined;
      }

      function isEndlessRuntimeAddress(value) {
        return typeof value === "string" && value.trim().length > 0 && !value.trim().startsWith("0x");
      }

      function appNetworkKey() {
        return session?.chainKey === "ENDLESS_MAINNET" ? "endless" : "eds";
      }

      window.endlessWallet = {
        sendResponse(raw) {
          try {
            const response = parseBridgeResponse(raw);
            const key = String(response.uuid ?? "") + String(response.methodName ?? "");
            const normalized = normalizeResponse(response);
            lastBridgeDebug = {
              methodName: response.methodName ?? null,
              uuid: response.uuid ?? null,
              rawResponse: response,
              normalizedResponse: normalized,
            };
            setDebug(lastBridgeDebug);
            sendDebug("bridge_response:" + String(response.methodName ?? "unknown"), formatDebug(lastBridgeDebug));
            if (!callbacks[key]) {
              setStatus("Luffa App response received, but no matching pending request was found.", true);
              return;
            }
            callbacks[key](normalized);
            delete callbacks[key];
          } catch (error) {
            setStatus("Luffa App response parse failed: " + String(error?.message ?? error), true);
          }
        },
      };

      function request(methodName, data) {
        return new Promise((resolve, reject) => {
          const uuid = Date.now().toString();
          const key = uuid + methodName;
          const timeout = setTimeout(() => {
            delete callbacks[key];
            reject(new Error("Luffa App " + methodName + " response timed out"));
          }, 60000);
          callbacks[key] = (value) => {
            clearTimeout(timeout);
            resolve(value);
          };
          setDebug({
            pendingRequest: methodName,
            uuid,
            note: "Waiting for Luffa App bridge response",
          });
          sendDebug("bridge_request:" + methodName, formatDebug({ methodName, uuid, data }));
          const sent = sendLuffaMessage({
            uuid,
            methodName,
            metadata: {
              title: document.title,
              url: location.href,
              origin: location.origin,
              icon: "",
              gameId: "lael-p0",
              userId: session?.ownerRef ?? "",
              walletAddress: "",
            },
            initData: {
              network: appNetworkKey(),
            },
            from: currentAccountAddress || null,
            data,
          });
          if (!sent) {
            clearTimeout(timeout);
            delete callbacks[key];
            reject(new Error("Luffa App WebView bridge not detected"));
          }
        });
      }

      async function claimSession() {
        const response = await fetch("/v2/endless/qr-sessions/" + encodeURIComponent(session.sessionId) + "/claim", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? "Endless QR authorization claim failed");
        }
        sendDebug("claim", formatDebug(body));
        return body;
      }

      function endlessTransferPayload() {
        return {
          payload: {
            function: "0x1::endless_account::transfer",
            functionArguments: [
              session.recipientAddress,
              String(Math.max(1, Math.round(Number(session.amount || 0) * 1e8))),
            ],
            typeArguments: ["address", "u128"],
            typeEnum: [],
          },
          secondarySignerAddresses: [],
          feePayer: "",
        };
      }

      async function approve() {
        if (!session) return;
        const storedStatus = storageKey ? sessionStorage.getItem(storageKey) : "";
        const localLockStatus = localLockKey ? localStorage.getItem(localLockKey) : "";
        if (approveStarted || terminalSession || storedStatus === "submitted" || storedStatus === "submitting" || localLockStatus === "submitting") {
          approveBtn.disabled = true;
          setStatus("Authorization is already being handled for this session. Return to LAEL and poll status, or generate a new QR if it is stuck.");
          return;
        }
        approveStarted = true;
        approveBtn.disabled = true;
        try {
          if (storageKey) sessionStorage.setItem(storageKey, "submitting");
          if (localLockKey) localStorage.setItem(localLockKey, "submitting");
          const claim = await claimSession();
          setStatus("Requesting Luffa App signature...");
          const account = await request("connect", {});
          currentAccountAddress = pickField(account, ["address", "account"]) ?? "";
          const signed = await request("signMessage", {
            address: true,
            application: true,
            chainId: true,
            message: appSigningMessage,
            nonce: session.nonce,
          });
          let txHash = "";
          let packagedTransaction = null;
          let packagedRawData = "";
          let submittedTransaction = null;
          if (session.businessAction !== "login") {
            if (!isEndlessRuntimeAddress(session.recipientAddress)) {
              throw new Error("Real Endless transaction requires a Luffa / Endless recipient address, not an EVM 0x address.");
            }
            setStatus("Packaging Endless transaction in Luffa App...");
            packagedTransaction = await request("packageTransactionV2", {
              data: JSON.stringify(endlessTransferPayload()),
            });
            packagedRawData = pickField(packagedTransaction, ["rawData", "raw_data", "transactionData", "transaction_data"]) ?? "";
            if (!packagedRawData) {
              setDebug({ claim, account, signed, endlessTransferPayload: endlessTransferPayload(), packagedTransaction, parsedRawData: null, bridge: lastBridgeDebug });
              sendDebug("missing_raw_data", formatDebug({ claim, account, signed, endlessTransferPayload: endlessTransferPayload(), packagedTransaction, parsedRawData: null, bridge: lastBridgeDebug }));
              throw new Error("Luffa App packageTransactionV2 response missing rawData. Raw response is shown below.");
            }
            setStatus("Submitting Endless transaction in Luffa App...");
            submittedTransaction = await request("signAndSubmitTransaction", {
              serializedTransaction: {
                data: packagedRawData,
              },
            });
            txHash = pickField(submittedTransaction, ["hash", "txHash", "tx_hash", "transactionHash", "transaction_hash", "txnHash", "txn_hash", "txId", "txid", "transactionId", "transaction_id", "digest", "id"]) ?? "";
            setDebug({ claim, account, signed, endlessTransferPayload: endlessTransferPayload(), packagedTransaction, packagedRawData, submittedTransaction, parsedTxHash: txHash || null, bridge: lastBridgeDebug });
            if (!txHash) {
              sendDebug("missing_tx_hash", formatDebug({ claim, account, signed, endlessTransferPayload: endlessTransferPayload(), packagedTransaction, packagedRawData, submittedTransaction, parsedTxHash: null, bridge: lastBridgeDebug }));
              throw new Error("Luffa App transaction response missing txHash. Raw response is shown below.");
            }
          }
          const debugSnapshot = { claim, account, signed, packagedTransaction, packagedRawData, submittedTransaction };
          setDebug(debugSnapshot);
          const publicKey = pickField(signed, ["publicKey", "public_key", "address", "account", "authKey", "auth_key"]) ?? pickField(account, ["publicKey", "public_key", "address", "account", "authKey", "auth_key"]);
          const fullMessage = pickField(signed, ["fullMessage", "full_message", "messageWithPrefix", "message_with_prefix"]) ?? appSigningMessage;
          const signature = pickField(signed, ["signature", "sig"]);
          if (!publicKey || !fullMessage || !signature) {
            throw new Error("Luffa App signMessage response missing publicKey/fullMessage/signature. Raw response is shown below.");
          }
          const payload = {
            status: "approved",
            source: "qr_scan_callback",
            address: pickField(signed, ["address", "account"]) ?? pickField(account, ["address", "account"]) ?? publicKey,
            publicKey,
            fullMessage,
            signature,
            txHash: txHash || undefined,
          };
          const callbackDebugSnapshot = { ...debugSnapshot, payload };
          setStatus("Submitting signed authorization...");
          const response = await fetch(session.callbackUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          const body = await response.json();
          setDebug({ ...callbackDebugSnapshot, callbackResponse: body });
          if (!response.ok) throw new Error(body.error ?? "Callback failed");
          if (storageKey) sessionStorage.setItem(storageKey, "submitted");
          if (localLockKey) localStorage.setItem(localLockKey, "submitted");
          setStatus("Authorization submitted. Return to LAEL and poll status.");
        } catch (error) {
          setStatus(String(error?.message ?? error), true);
          sendDebug("error", String(error?.message ?? error));
          if (storageKey) sessionStorage.removeItem(storageKey);
          if (localLockKey) localStorage.removeItem(localLockKey);
          approveStarted = false;
          approveBtn.disabled = false;
        }
      }

      if (!session) {
        approveBtn.disabled = true;
        setStatus(loadError || "Session unavailable", true);
      } else {
        const summaryRows = [
          ["Network", session.chainKey],
          ["Action", session.businessAction],
          ["Session", session.sessionId],
          ["Expires", session.expiresAt],
        ];
        if (session.businessAction !== "login") {
          summaryRows.splice(2, 0, ["Amount", session.amount + " " + session.asset], ["Recipient", session.recipientAddress]);
        }
        summaryEl.innerHTML = summaryRows.map(([label, value]) => "<div class='row'><dt>" + label + "</dt><dd>" + String(value) + "</dd></div>").join("");
        const submittedAlready = storageKey && sessionStorage.getItem(storageKey) === "submitted";
        if (terminalSession || submittedAlready) {
          approveBtn.disabled = true;
          debugEl.textContent = "Session status: " + session.status;
          setStatus("Authorization already submitted. Return to LAEL and poll status.");
        } else {
          setDebug("Session ready. URL values are hidden to avoid WebView jump prompts.");
          setStatus(hasBridge() ? "Ready to sign in Luffa App." : "Open this page inside Luffa App after scanning the QR.");
          approveBtn.addEventListener("click", approve, { once: true });
        }
      }
    </script>
  </body>
</html>`;
}
