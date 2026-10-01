import assert from "node:assert/strict";
import test from "node:test";
import { getApiKey } from "../src/auth/oauth.js";
import {
  ANTIGRAVITY_CLI_CHANGELIST,
  ANTIGRAVITY_CLI_VERSION,
  antigravityHeaders,
  parseApiKey,
} from "../src/client/client.js";
import {
  assertSafeApiBaseUrl,
  maskEmail,
  redactSecrets,
  resolveCallbackHost,
} from "../src/utils/security.js";

test("security helpers reject unsafe endpoints and redact credentials", () => {
  assert.equal(
    assertSafeApiBaseUrl("https://cloudcode-pa.googleapis.com/"),
    "https://cloudcode-pa.googleapis.com",
  );
  assert.throws(() => assertSafeApiBaseUrl("http://cloudcode-pa.googleapis.com"), /https/);
  assert.throws(() => assertSafeApiBaseUrl("https://googleapis.com.evil.test"), /not allowed/);
  assert.throws(() => assertSafeApiBaseUrl("https://user:pass@googleapis.com"), /credentials/);

  const redacted = redactSecrets(
    'Bearer ya29.secret-token {"access_token":"ya29.another-secret"}',
  );
  assert(!redacted.includes("secret-token"));
  assert(!redacted.includes("another-secret"));
  assert.match(redacted, /\[redacted/);
});

test("callback host stays on loopback and email display is masked", () => {
  assert.equal(resolveCallbackHost("localhost"), "127.0.0.1");
  assert.equal(resolveCallbackHost("::1"), "::1");
  assert.throws(() => resolveCallbackHost("0.0.0.0"), /Unsafe/);
  assert.equal(maskEmail("alice@example.com"), "a***e@example.com");
});

test("request fingerprint matches the official Antigravity CLI", () => {
  const headers = antigravityHeaders("tok");
  assert.equal(
    headers["User-Agent"],
    `antigravity/cli/${ANTIGRAVITY_CLI_VERSION} (aidev_client; os_type=${process.platform === "darwin" ? "darwin" : process.platform === "win32" ? "windows" : "linux"}; arch=${process.arch === "x64" ? "amd64" : process.arch}; cl=${ANTIGRAVITY_CLI_CHANGELIST}; auth_method=consumer)`,
  );
  // The CLI sends neither of these; a stale value is what the backend fingerprints on.
  assert.equal(headers["X-Goog-Api-Client"], undefined);
  assert.equal(headers["Client-Metadata"], undefined);
  assert.equal(headers.Authorization, "Bearer tok");
});

test("OAuth credentials round-trip through the provider API-key format", () => {
  const encoded = getApiKey({
    access: "access-token",
    refresh: "refresh-token",
    expires: Date.now() + 60_000,
    projectId: "project-id",
  });
  assert.deepEqual(parseApiKey(encoded), {
    token: "access-token",
    projectId: "project-id",
  });
});
