#!/usr/bin/env node

const apiUrl = process.env.LAEL_API_URL || "http://127.0.0.1:3000";
const frontendUrl = process.env.LAEL_FRONTEND_URL || "http://127.0.0.1:3001/?health=1";
const publicBaseOverride = process.env.LAEL_PUBLIC_CALLBACK_BASE_URL;
const chainKey = process.env.LAEL_HEALTH_CHAIN_KEY || "ENDLESS_TESTNET";
const probeCount = Number(process.env.LAEL_HEALTH_PUBLIC_PROBES || "3");

const checks = [];

function record(name, ok, detail = {}) {
  checks.push({ name, ok, ...detail });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type") || "",
      text,
      ms: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  let runtimeConfig;
  try {
    const localRuntime = await fetchWithTimeout(`${apiUrl}/v2/runtime-config`);
    record("api.runtime-config.local", localRuntime.ok, { status: localRuntime.status, ms: localRuntime.ms });
    if (localRuntime.ok) runtimeConfig = JSON.parse(localRuntime.text);
  } catch (error) {
    record("api.runtime-config.local", false, { error: error.message });
  }

  try {
    const frontend = await fetchWithTimeout(frontendUrl);
    record("frontend.page.local", frontend.ok, { status: frontend.status, ms: frontend.ms });
  } catch (error) {
    record("frontend.page.local", false, { error: error.message });
  }

  const publicBase = publicBaseOverride || runtimeConfig?.publicCallback?.baseUrl;
  const publicConfigured = Boolean(publicBase && /^https:\/\//.test(publicBase));
  record("callback.public-base.configured", publicConfigured, {
    publicBase: publicBase || null,
    localOnly: runtimeConfig?.publicCallback?.localOnly ?? null,
  });

  if (publicConfigured) {
    for (let index = 0; index < probeCount; index += 1) {
      try {
        const publicRuntime = await fetchWithTimeout(`${publicBase}/v2/runtime-config`, {}, 15000);
        let sameBase = false;
        if (publicRuntime.ok) {
          const parsed = JSON.parse(publicRuntime.text);
          sameBase = parsed?.publicCallback?.baseUrl === publicBase;
        }
        record(`callback.public-runtime.${index + 1}`, publicRuntime.ok && sameBase, {
          status: publicRuntime.status,
          ms: publicRuntime.ms,
          sameBase,
        });
      } catch (error) {
        record(`callback.public-runtime.${index + 1}`, false, { error: error.message });
      }
    }

    try {
      const createSession = await fetchWithTimeout(`${apiUrl}/v2/endless/qr-sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ownerRef: "did:luffa:health_probe",
          chainKey,
          businessAction: "login",
          intent: "Luffa App QR health probe",
          amount: 0,
          asset: "EDS",
          recipientAddress: "",
        }),
      });
      let session;
      if (createSession.ok) session = JSON.parse(createSession.text);
      record("endless.qr-session.create", createSession.ok && Boolean(session?.scanUrl), {
        status: createSession.status,
        ms: createSession.ms,
        sessionId: session?.sessionId || null,
        scanUrl: session?.scanUrl || null,
      });

      if (session?.scanUrl) {
        const scan = await fetchWithTimeout(session.scanUrl, {}, 15000);
        const hasAuthPage = scan.text.includes("Luffa App Authorization") && scan.text.includes("Sign With Luffa App");
        record("endless.scan-page.public", scan.ok && hasAuthPage, {
          status: scan.status,
          contentType: scan.contentType,
          ms: scan.ms,
          hasAuthPage,
        });
      }
    } catch (error) {
      record("endless.scan-page.public", false, { error: error.message });
    }
  }

  const ok = checks.every((check) => check.ok);
  const output = {
    ok,
    checkedAt: new Date().toISOString(),
    apiUrl,
    frontendUrl,
    publicBase: publicBase || null,
    chainKey,
    checks,
  };
  console.log(JSON.stringify(output, null, 2));
  if (!ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
