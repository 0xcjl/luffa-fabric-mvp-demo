import type { ChainKey } from "../chains/types.js";
import type { SettlementAsset } from "../settlement/types.js";
import { newId, nowIso, stableJson, sha256Hex } from "../utils.js";
import { verifyWalletSignature, WalletType } from "../wallet/index.js";

export type EndlessQrStatus = "waiting" | "approved" | "rejected" | "expired" | "failed";
export type EndlessBusinessAction = "login" | "transfer" | "task_reward";
export type EndlessCallbackSource = "qr_scan_callback" | "webview_bridge" | "protocol_mock";

export interface CreateEndlessQrSessionInput {
  ownerRef: string;
  chainKey: Extract<ChainKey, "ENDLESS_TESTNET" | "ENDLESS_MAINNET">;
  intent: string;
  businessAction: EndlessBusinessAction;
  amount: number;
  asset: Extract<SettlementAsset, "EDS">;
  recipientAddress: string;
}

export interface EndlessQrCallbackInput {
  status: "approved" | "rejected" | "failed";
  source?: EndlessCallbackSource;
  address?: string;
  publicKey?: string;
  fullMessage?: string;
  signature?: string;
  txHash?: string;
  error?: string;
}

export interface EndlessAuthorizationReceipt {
  receiptId: string;
  sessionId: string;
  ownerRef: string;
  chainKey: string;
  businessAction: EndlessBusinessAction;
  status: EndlessQrStatus;
  callbackSource: EndlessCallbackSource;
  address?: string;
  publicKey?: string;
  fullMessage?: string;
  signature?: string;
  signatureVerified: boolean;
  txHash?: string;
  approvedWithoutTxHash: boolean;
  evidenceDigest: string;
  createdAt: string;
}

export interface EndlessAuthorizationClaim {
  claimId: string;
  source: "qr_scan";
  claimedAt: string;
  expiresAt: string;
}

export interface EndlessQrTargets {
  scanUrl: string;
  deepLinkUrl: string;
  compactJson: string;
  keyValue: string;
}

export interface EndlessQrSession {
  version: "v1";
  sessionId: string;
  ownerRef: string;
  chainKey: string;
  businessAction: EndlessBusinessAction;
  intent: string;
  amount: number;
  asset: "EDS";
  recipientAddress: string;
  nonce: string;
  expiresAt: string;
  callbackUrl: string;
  callbackLocalOnly: boolean;
  scanUrl: string;
  qrTargets: EndlessQrTargets;
  signingMessage: string;
  status: EndlessQrStatus;
  qrPayload: {
    protocol: "luffa-endless-auth";
    version: "v1";
    sessionId: string;
    ownerRef: string;
    chainKey: string;
    businessAction: EndlessBusinessAction;
    intent: string;
    amount: number;
    asset: "EDS";
    recipientAddress: string;
    nonce: string;
    expiresAt: string;
    callbackUrl: string;
    callbackLocalOnly: boolean;
    scanUrl: string;
    qrTargets: EndlessQrTargets;
    signingMessage: string;
  };
  authorizationReceipt?: EndlessAuthorizationReceipt;
  authorizationClaim?: EndlessAuthorizationClaim;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export class EndlessQrSessionService {
  private readonly sessions = new Map<string, EndlessQrSession>();

  create(input: CreateEndlessQrSessionInput): EndlessQrSession {
    assertCreateInput(input);

    const sessionId = newId("endless_qr");
    const nonce = newId("nonce");
    const now = nowIso();
    const expiresAt = new Date(Date.now() + endlessQrTtlMs()).toISOString();
    const { callbackUrl, callbackLocalOnly, scanUrl } = buildSessionUrls(sessionId);
    const baseSession = {
      version: "v1" as const,
      sessionId,
      ownerRef: input.ownerRef,
      chainKey: input.chainKey,
      businessAction: input.businessAction,
      intent: input.intent,
      amount: input.amount,
      asset: input.asset,
      recipientAddress: input.recipientAddress,
      nonce,
      expiresAt,
      callbackUrl,
      callbackLocalOnly,
      scanUrl,
    };
    const signingMessage = createEndlessAuthorizationMessage(baseSession);
    const qrTargets = buildQrTargets(baseSession, signingMessage);
    const session: EndlessQrSession = {
      ...baseSession,
      qrTargets,
      signingMessage,
      status: "waiting",
      qrPayload: {
        protocol: "luffa-endless-auth",
        ...baseSession,
        qrTargets,
        signingMessage,
      },
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  get(sessionId: string): EndlessQrSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (session.status === "waiting" && Date.now() > new Date(session.expiresAt).getTime()) {
      const expired = { ...session, status: "expired" as const, updatedAt: nowIso() };
      this.sessions.set(sessionId, expired);
      return expired;
    }
    return session;
  }

  async applyCallback(sessionId: string, input: EndlessQrCallbackInput): Promise<EndlessQrSession> {
    const session = this.get(sessionId);
    if (!session) {
      throw new Error("Endless QR session not found");
    }
    if (session.status === "expired") {
      throw new Error("Endless QR session expired");
    }
    if (session.status !== "waiting") {
      throw new Error("Endless QR session already finalized");
    }

    const source = input.source ?? "qr_scan_callback";
    const signatureVerified = await verifyCallbackSignature(session, input, source);
    const updatedAt = nowIso();
    const authorizationReceipt =
      input.status === "approved"
        ? buildAuthorizationReceipt(session, input, source, signatureVerified, updatedAt)
        : undefined;
    const updated: EndlessQrSession = {
      ...session,
      status: input.status,
      authorizationReceipt,
      error: input.error,
      updatedAt,
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  claim(sessionId: string): EndlessAuthorizationClaim {
    const session = this.get(sessionId);
    if (!session) {
      throw new Error("Endless QR session not found");
    }
    if (session.status === "expired") {
      throw new Error("Endless QR session expired");
    }
    if (session.status !== "waiting") {
      throw new Error("Endless QR session already finalized");
    }
    const now = Date.now();
    const existingClaim = session.authorizationClaim;
    if (existingClaim && now <= new Date(existingClaim.expiresAt).getTime()) {
      throw new Error("Endless QR authorization already in progress");
    }
    const claim: EndlessAuthorizationClaim = {
      claimId: newId("endless_claim"),
      source: "qr_scan",
      claimedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + endlessQrClaimTtlMs()).toISOString(),
    };
    this.sessions.set(sessionId, {
      ...session,
      authorizationClaim: claim,
      updatedAt: nowIso(),
    });
    return claim;
  }
}

export function createEndlessAuthorizationMessage(input: {
  version: "v1";
  sessionId: string;
  ownerRef: string;
  chainKey: string;
  businessAction: EndlessBusinessAction;
  intent: string;
  amount: number;
  asset: string;
  recipientAddress: string;
  nonce: string;
  expiresAt: string;
  callbackUrl: string;
  callbackLocalOnly: boolean;
  scanUrl: string;
}): string {
  const commonLines = [
    "Luffa Endless Authorization",
    `version=${input.version}`,
    `sessionId=${input.sessionId}`,
    `ownerRef=${input.ownerRef}`,
    `chainKey=${input.chainKey}`,
    `businessAction=${input.businessAction}`,
    `nonce=${input.nonce}`,
    `expiresAt=${input.expiresAt}`,
    `callbackUrl=${input.callbackUrl}`,
    `callbackLocalOnly=${input.callbackLocalOnly}`,
    `scanUrl=${input.scanUrl}`,
  ];
  if (input.businessAction === "login") {
    return commonLines.join("\n");
  }
  return [
    ...commonLines,
    `intent=${input.intent}`,
    `amount=${input.amount}`,
    `asset=${input.asset}`,
    `recipientAddress=${input.recipientAddress}`,
  ].join("\n");
}

async function verifyCallbackSignature(
  session: EndlessQrSession,
  input: EndlessQrCallbackInput,
  source: EndlessCallbackSource,
): Promise<boolean> {
  if (source === "protocol_mock") {
    return false;
  }
  if (!input.publicKey || !input.fullMessage || !input.signature) {
    throw new Error("Signed Luffa App callback requires publicKey, fullMessage, and signature");
  }
  if (!isSessionBoundFullMessage(session, input.fullMessage)) {
    throw new Error("Luffa App callback signed message mismatch");
  }
  const verified = await verifyWalletSignature({
    walletType: WalletType.LUFFA,
    chainType: "endless",
    address: input.publicKey,
    message: input.fullMessage,
    signature: input.signature,
  });
  if (!verified) {
    throw new Error("Luffa App callback signature verification failed");
  }
  return true;
}

function isSessionBoundFullMessage(session: EndlessQrSession, fullMessage: string): boolean {
  if (fullMessage === session.signingMessage) return true;
  return (
    fullMessage.includes(session.sessionId) &&
    fullMessage.includes(session.nonce) &&
    fullMessage.includes(session.callbackUrl)
  );
}

function buildAuthorizationReceipt(
  session: EndlessQrSession,
  input: EndlessQrCallbackInput,
  source: EndlessCallbackSource,
  signatureVerified: boolean,
  createdAt: string,
): EndlessAuthorizationReceipt {
  if (!input.address && !input.publicKey) {
    throw new Error("Approved Luffa App callback requires address or publicKey");
  }
  return {
    receiptId: newId("endless_auth"),
    sessionId: session.sessionId,
    ownerRef: session.ownerRef,
    chainKey: session.chainKey,
    businessAction: session.businessAction,
    status: "approved",
    callbackSource: source,
    address: input.address,
    publicKey: input.publicKey,
    fullMessage: input.fullMessage,
    signature: input.signature,
    signatureVerified,
    txHash: input.txHash,
    approvedWithoutTxHash: !input.txHash,
    evidenceDigest: sha256Hex(
      stableJson({
        sessionId: session.sessionId,
        ownerRef: session.ownerRef,
        chainKey: session.chainKey,
        businessAction: session.businessAction,
        intent: session.intent,
        amount: session.amount,
        asset: session.asset,
        recipientAddress: session.recipientAddress,
        nonce: session.nonce,
        callbackSource: source,
        signatureVerified,
        txHash: input.txHash,
        createdAt,
      }),
    ),
    createdAt,
  };
}

function assertCreateInput(input: CreateEndlessQrSessionInput): void {
  if (!input.ownerRef || !input.chainKey || !input.intent) {
    throw new Error("ownerRef, chainKey, and intent are required");
  }
  if (input.chainKey !== "ENDLESS_TESTNET" && input.chainKey !== "ENDLESS_MAINNET") {
    throw new Error("Only Endless chains can create Luffa App QR sessions");
  }
  if (input.businessAction !== "login" && input.businessAction !== "transfer" && input.businessAction !== "task_reward") {
    throw new Error("businessAction must be login, transfer, or task_reward");
  }
  if (input.businessAction === "login") {
    return;
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("amount must be a positive number");
  }
  if (input.asset !== "EDS") {
    throw new Error("Endless QR authorization currently supports EDS only");
  }
  if (!input.recipientAddress) {
    throw new Error("recipientAddress is required");
  }
}

function buildSessionUrls(sessionId: string): { callbackUrl: string; callbackLocalOnly: boolean; scanUrl: string } {
  const callbackPath = `/v2/endless/qr-sessions/${sessionId}/callback`;
  const scanPath = `/v2/endless/qr-sessions/${sessionId}/scan`;
  const baseUrl = process.env.LAEL_PUBLIC_CALLBACK_BASE_URL?.trim();
  if (!baseUrl) {
    return { callbackUrl: callbackPath, callbackLocalOnly: true, scanUrl: scanPath };
  }
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return {
    callbackUrl: `${normalizedBaseUrl}${callbackPath}`,
    callbackLocalOnly: false,
    scanUrl: `${normalizedBaseUrl}${scanPath}`,
  };
}

function buildQrTargets(input: {
  version: "v1";
  sessionId: string;
  ownerRef: string;
  chainKey: string;
  businessAction: EndlessBusinessAction;
  intent: string;
  amount: number;
  asset: string;
  recipientAddress: string;
  nonce: string;
  expiresAt: string;
  callbackUrl: string;
  callbackLocalOnly: boolean;
  scanUrl: string;
}, signingMessage: string): EndlessQrTargets {
  const compactPayload = {
    protocol: "luffa-endless-auth",
    version: input.version,
    sessionId: input.sessionId,
    nonce: input.nonce,
    chainKey: input.chainKey,
    businessAction: input.businessAction,
    amount: input.amount,
    asset: input.asset,
    recipientAddress: input.recipientAddress,
    callbackUrl: input.callbackUrl,
    scanUrl: input.scanUrl,
  };
  const params = new URLSearchParams({
    protocol: "luffa-endless-auth",
    version: input.version,
    sessionId: input.sessionId,
    nonce: input.nonce,
    chainKey: input.chainKey,
    businessAction: input.businessAction,
    callbackUrl: input.callbackUrl,
    scanUrl: input.scanUrl,
  });
  if (input.businessAction !== "login") {
    params.set("amount", String(input.amount));
    params.set("asset", input.asset);
    params.set("recipientAddress", input.recipientAddress);
  }
  return {
    scanUrl: input.scanUrl,
    deepLinkUrl: `luffa://endless-auth?${params.toString()}`,
    compactJson: stableJson(compactPayload),
    keyValue: [
      "protocol=luffa-endless-auth",
      `version=${input.version}`,
      `sessionId=${input.sessionId}`,
      `nonce=${input.nonce}`,
      `chainKey=${input.chainKey}`,
      `businessAction=${input.businessAction}`,
      `callbackUrl=${input.callbackUrl}`,
      `scanUrl=${input.scanUrl}`,
      `signingMessage=${signingMessage}`,
    ].join("\n"),
  };
}

function endlessQrTtlMs(): number {
  const configured = Number(process.env.LAEL_ENDLESS_QR_TTL_MS ?? 5 * 60 * 1000);
  return Number.isFinite(configured) && configured > 0 ? configured : 5 * 60 * 1000;
}

function endlessQrClaimTtlMs(): number {
  const configured = Number(process.env.LAEL_ENDLESS_QR_CLAIM_TTL_MS ?? 2 * 60 * 1000);
  return Number.isFinite(configured) && configured > 0 ? configured : 2 * 60 * 1000;
}
