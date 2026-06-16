import { describe, expect, it } from "vitest";
import { buildServer } from "../src/api/server.js";
import { createDevWalletSignature } from "../src/wallet/index.js";

const endlessPayload = {
  ownerRef: "did:luffa:user_001",
  chainKey: "ENDLESS_TESTNET",
  businessAction: "task_reward",
  intent: "Agent complete a small task and reward Alice with Luffa App on Endless testnet",
  amount: 1,
  asset: "EDS",
  recipientAddress: "0x0000000000000000000000000000000000000000000000000000000000000002",
};

describe("Endless / Luffa App QR sessions", () => {
  it("creates a login session without transfer intent fields in the signed message", async () => {
    const { app } = await buildServer({ path: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: {
        ownerRef: "did:luffa:user_001",
        chainKey: "ENDLESS_TESTNET",
        businessAction: "login",
        intent: "Connect Luffa App wallet to LAEL DID",
        amount: 0,
        asset: "EDS",
        recipientAddress: "",
      },
    });
    const body = created.json() as { businessAction: string; signingMessage: string };

    expect(created.statusCode).toBe(201);
    expect(body.businessAction).toBe("login");
    expect(body.signingMessage).toContain("businessAction=login");
    expect(body.signingMessage).toContain("chainKey=ENDLESS_TESTNET");
    expect(body.signingMessage).toContain("nonce=");
    expect(body.signingMessage).not.toContain("intent=");
    expect(body.signingMessage).not.toContain("amount=");
    expect(body.signingMessage).not.toContain("recipientAddress=");

    await app.close();
  });

  it("exposes public callback tunnel requirements in runtime config", async () => {
    const previousBaseUrl = process.env.LAEL_PUBLIC_CALLBACK_BASE_URL;
    process.env.LAEL_PUBLIC_CALLBACK_BASE_URL = "https://example-tunnel.trycloudflare.com/";
    const { app } = await buildServer({ path: ":memory:" });
    try {
      const response = await app.inject({
        method: "GET",
        url: "/v2/runtime-config",
      });
      const body = response.json() as {
        publicCallback: {
          envVar: string;
          baseUrl: string;
          configured: boolean;
          localOnly: boolean;
          requirement: string;
          restartRequired: boolean;
          oldQrInvalidAfterChange: boolean;
        };
      };

      expect(response.statusCode).toBe(200);
      expect(body.publicCallback.envVar).toBe("LAEL_PUBLIC_CALLBACK_BASE_URL");
      expect(body.publicCallback.baseUrl).toBe("https://example-tunnel.trycloudflare.com");
      expect(body.publicCallback.configured).toBe(true);
      expect(body.publicCallback.localOnly).toBe(false);
      expect(body.publicCallback.requirement).toContain("Cloudflare Tunnel");
      expect(body.publicCallback.restartRequired).toBe(true);
      expect(body.publicCallback.oldQrInvalidAfterChange).toBe(true);
    } finally {
      await app.close();
      if (previousBaseUrl === undefined) {
        delete process.env.LAEL_PUBLIC_CALLBACK_BASE_URL;
      } else {
        process.env.LAEL_PUBLIC_CALLBACK_BASE_URL = previousBaseUrl;
      }
    }
  });

  it("creates a v1 browser-to-app authorization payload and exposes polling status", async () => {
    const { app } = await buildServer({ path: ":memory:" });

    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: endlessPayload,
    });
    const body = created.json() as {
      version: string;
      sessionId: string;
      status: string;
      businessAction: string;
      amount: number;
      asset: string;
      recipientAddress: string;
      nonce: string;
      expiresAt: string;
      callbackUrl: string;
      callbackLocalOnly: boolean;
      scanUrl: string;
      signingMessage: string;
      qrPayload: {
        protocol: string;
        version: string;
        sessionId: string;
        callbackUrl: string;
        callbackLocalOnly: boolean;
        scanUrl: string;
        signingMessage: string;
      };
    };
    const polled = await app.inject({
      method: "GET",
      url: `/v2/endless/qr-sessions/${body.sessionId}`,
    });

    expect(created.statusCode).toBe(201);
    expect(body.version).toBe("v1");
    expect(body.sessionId).toMatch(/^endless_qr_/);
    expect(body.status).toBe("waiting");
    expect(body.businessAction).toBe("task_reward");
    expect(body.amount).toBe(1);
    expect(body.asset).toBe("EDS");
    expect(body.recipientAddress).toBe(endlessPayload.recipientAddress);
    expect(body.nonce).toMatch(/^nonce_/);
    expect(body.callbackUrl).toBe(`/v2/endless/qr-sessions/${body.sessionId}/callback`);
    expect(body.scanUrl).toBe(`/v2/endless/qr-sessions/${body.sessionId}/scan`);
    expect(body.callbackLocalOnly).toBe(true);
    expect(body.signingMessage).toContain(`sessionId=${body.sessionId}`);
    expect(body.signingMessage).toContain(`scanUrl=${body.scanUrl}`);
    expect(body.signingMessage).toContain("businessAction=task_reward");
    expect(body.qrPayload).toMatchObject({
      protocol: "luffa-endless-auth",
      version: "v1",
      sessionId: body.sessionId,
      callbackUrl: body.callbackUrl,
      callbackLocalOnly: true,
      scanUrl: body.scanUrl,
      signingMessage: body.signingMessage,
    });
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(polled.statusCode).toBe(200);
    expect(polled.json()).toMatchObject({ sessionId: body.sessionId, status: "waiting" });

    await app.close();
  });

  it("serves an HTTPS-scan-compatible authorization page for Luffa App QR scanners", async () => {
    const { app } = await buildServer({ path: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: endlessPayload,
    });
    const session = created.json() as { sessionId: string; scanUrl: string };

    const page = await app.inject({
      method: "GET",
      url: `/v2/endless/qr-sessions/${session.sessionId}/scan`,
    });

    expect(session.scanUrl).toBe(`/v2/endless/qr-sessions/${session.sessionId}/scan`);
    expect(page.statusCode).toBe(200);
    expect(page.headers["content-type"]).toContain("text/html");
    expect(page.body).toContain("Luffa App Authorization");
    expect(page.body).toContain("signMessage");
    expect(page.body).toContain("qr_scan_callback");
    expect(page.body).toContain("ENDLESS_MAINNET");
    expect(page.body).toContain('"endless"');
    expect(page.body).toContain('"eds"');
    expect(page.body).toContain("from: currentAccountAddress");
    expect(page.body).toContain("appSigningMessage");
    expect(page.body).toContain('split("\\n").join(" | ")');
    expect(page.body).toContain("message: appSigningMessage");
    expect(page.body).toContain("callbackResponse");
    expect(page.body).toContain("URL values are hidden to avoid WebView jump prompts");
    expect(page.body).toContain("lael:endless-auth:");
    expect(page.body).toContain('addEventListener("click", approve, { once: true })');
    expect(page.body).toContain("Authorization already submitted. Return to LAEL and poll status.");
    expect(page.body).toContain("packageTransactionV2");
    expect(page.body).toContain("signAndSubmitTransaction");
    expect(page.body).toContain("packagedRawData");
    expect(page.body).toContain("missing_raw_data");
    expect(page.body).not.toContain("buildSerializedTransaction");
    expect(page.body).not.toContain("/build-transaction");
    expect(page.body).toContain("endlessTransferPayload");
    expect(page.body).toContain("0x1::endless_account::transfer");
    expect(page.body).not.toContain('methodName: "packageTransaction"');
    expect(page.body).not.toContain("buildLegacyTransferData");
    expect(page.body).not.toContain('"1_address_address"');
    expect(page.body).not.toContain("retrying legacy packageTransaction");
    expect(page.body).toContain("claimSession");
    expect(page.body).toContain("/claim");
    expect(page.body).toContain("serializedTransaction");
    expect(page.body).toContain("Luffa App transaction response missing txHash");
    expect(page.body).toContain("lael:endless-auth-lock:");
    expect(page.body).toContain("Authorization is already being handled for this session");
    expect(page.body).toContain("/debug");
    expect(page.body).toContain("bridge_response:");
    expect(page.body).toContain("missing_tx_hash");
    expect(page.body).not.toContain("debugEl.textContent = session.scanUrl");

    await app.close();
  });

  it("serializes QR authorization attempts with a server-side claim", async () => {
    const { app } = await buildServer({ path: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: endlessPayload,
    });
    const session = created.json() as { sessionId: string };

    const firstClaim = await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/claim`,
    });
    const secondClaim = await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/claim`,
    });
    const body = firstClaim.json() as { sessionId: string; claimId: string; source: string; expiresAt: string };

    expect(firstClaim.statusCode).toBe(201);
    expect(body.sessionId).toBe(session.sessionId);
    expect(body.claimId).toMatch(/^endless_claim_/);
    expect(body.source).toBe("qr_scan");
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(secondClaim.statusCode).toBe(409);
    expect(secondClaim.json()).toMatchObject({
      error: "Endless QR authorization already in progress",
    });

    await app.close();
  });

  it("records WebView debug events for QR troubleshooting", async () => {
    const { app } = await buildServer({ path: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: endlessPayload,
    });
    const session = created.json() as { sessionId: string };

    const posted = await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/debug`,
      payload: {
        stage: "missing_tx_hash",
        debug: "transaction response without txHash",
      },
    });
    const fetched = await app.inject({
      method: "GET",
      url: `/v2/endless/qr-sessions/${session.sessionId}/debug`,
    });
    const body = fetched.json() as {
      sessionId: string;
      events: Array<{ stage: string; debug: string }>;
    };

    expect(posted.statusCode).toBe(201);
    expect(fetched.statusCode).toBe(200);
    expect(body.sessionId).toBe(session.sessionId);
    expect(body.events).toHaveLength(1);
    expect(body.events[0]).toMatchObject({
      stage: "missing_tx_hash",
      debug: "transaction response without txHash",
    });

    await app.close();
  });

  it("renders approved scan sessions as terminal so WebView reloads cannot trigger repeated signing", async () => {
    const { app } = await buildServer({ path: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: endlessPayload,
    });
    const session = created.json() as { sessionId: string; signingMessage: string };
    const publicKey = "0x0000000000000000000000000000000000000000000000000000000000000001";

    await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/callback`,
      payload: {
        status: "approved",
        source: "qr_scan_callback",
        address: publicKey,
        publicKey,
        fullMessage: session.signingMessage,
        signature: createDevWalletSignature(session.signingMessage, publicKey),
      },
    });
    const page = await app.inject({
      method: "GET",
      url: `/v2/endless/qr-sessions/${session.sessionId}/scan`,
    });

    expect(page.statusCode).toBe(200);
    expect(page.body).toContain('"status":"approved"');
    expect(page.body).toContain("terminalSession");
    expect(page.body).toContain("approveBtn.disabled = true");
    expect(page.body).toContain("Authorization already submitted. Return to LAEL and poll status.");

    await app.close();
  });

  it("accepts a signed app callback and returns a verified authorization receipt", async () => {
    const { app } = await buildServer({ path: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: endlessPayload,
    });
    const session = created.json() as { sessionId: string; signingMessage: string };
    const publicKey = "0x0000000000000000000000000000000000000000000000000000000000000001";

    const approved = await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/callback`,
      payload: {
        status: "approved",
        source: "qr_scan_callback",
        address: publicKey,
        publicKey,
        fullMessage: session.signingMessage,
        signature: createDevWalletSignature(session.signingMessage, publicKey),
        txHash: "0xendless_tx_hash",
      },
    });
    const body = approved.json() as {
      status: string;
      authorizationReceipt: {
        receiptId: string;
        sessionId: string;
        chainKey: string;
        businessAction: string;
        callbackSource: string;
        signatureVerified: boolean;
        txHash?: string;
        approvedWithoutTxHash: boolean;
      };
    };

    expect(approved.statusCode).toBe(200);
    expect(body.status).toBe("approved");
    expect(body.authorizationReceipt).toMatchObject({
      sessionId: session.sessionId,
      chainKey: "ENDLESS_TESTNET",
      businessAction: "task_reward",
      callbackSource: "qr_scan_callback",
      signatureVerified: true,
      txHash: "0xendless_tx_hash",
      approvedWithoutTxHash: false,
    });
    expect(body.authorizationReceipt.receiptId).toMatch(/^endless_auth_/);

    await app.close();
  });

  it("accepts SDK fullMessage wrappers when they bind the same session nonce", async () => {
    const { app } = await buildServer({ path: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: endlessPayload,
    });
    const session = created.json() as { sessionId: string; signingMessage: string; nonce: string };
    const publicKey = "0x0000000000000000000000000000000000000000000000000000000000000001";
    const fullMessage = `Endless::Message\nmessage: ${session.signingMessage}\nnonce: ${session.nonce}`;

    const approved = await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/callback`,
      payload: {
        status: "approved",
        source: "qr_scan_callback",
        address: publicKey,
        publicKey,
        fullMessage,
        signature: createDevWalletSignature(fullMessage, publicKey),
      },
    });

    expect(approved.statusCode).toBe(200);
    expect(approved.json().authorizationReceipt).toMatchObject({
      sessionId: session.sessionId,
      callbackSource: "qr_scan_callback",
      signatureVerified: true,
      approvedWithoutTxHash: true,
    });

    await app.close();
  });

  it("rejects unsigned real callbacks and duplicate callbacks", async () => {
    const { app } = await buildServer({ path: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: endlessPayload,
    });
    const session = created.json() as { sessionId: string; signingMessage: string };
    const publicKey = "0x0000000000000000000000000000000000000000000000000000000000000001";

    const unsigned = await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/callback`,
      payload: {
        status: "approved",
        source: "qr_scan_callback",
        address: publicKey,
        publicKey,
      },
    });
    expect(unsigned.statusCode).toBe(400);
    expect(unsigned.json()).toMatchObject({
      error: "Signed Luffa App callback requires publicKey, fullMessage, and signature",
    });

    const approved = await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/callback`,
      payload: {
        status: "approved",
        source: "webview_bridge",
        address: publicKey,
        publicKey,
        fullMessage: session.signingMessage,
        signature: createDevWalletSignature(session.signingMessage, publicKey),
      },
    });
    expect(approved.statusCode).toBe(200);
    expect(approved.json().authorizationReceipt).toMatchObject({
      callbackSource: "webview_bridge",
      signatureVerified: true,
      approvedWithoutTxHash: true,
    });

    const duplicate = await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/callback`,
      payload: {
        status: "approved",
        source: "webview_bridge",
        address: publicKey,
        publicKey,
        fullMessage: session.signingMessage,
        signature: createDevWalletSignature(session.signingMessage, publicKey),
      },
    });
    expect(duplicate.statusCode).toBe(400);
    expect(duplicate.json()).toMatchObject({ error: "Endless QR session already finalized" });

    await app.close();
  });

  it("keeps protocol mock callbacks visibly separate from real App authorization", async () => {
    const { app } = await buildServer({ path: ":memory:" });
    const created = await app.inject({
      method: "POST",
      url: "/v2/endless/qr-sessions",
      payload: endlessPayload,
    });
    const session = created.json() as { sessionId: string };

    const approved = await app.inject({
      method: "POST",
      url: `/v2/endless/qr-sessions/${session.sessionId}/callback`,
      payload: {
        status: "approved",
        source: "protocol_mock",
        address: "0xmock_endless_account",
        txHash: "endless_mock_tx_001",
      },
    });

    expect(approved.statusCode).toBe(200);
    expect(approved.json().authorizationReceipt).toMatchObject({
      callbackSource: "protocol_mock",
      signatureVerified: false,
      txHash: "endless_mock_tx_001",
    });

    await app.close();
  });
});
