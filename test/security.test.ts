import assert from "node:assert/strict";
import test from "node:test";
import { getApiKey } from "../src/auth/oauth.js";
import { parseApiKey } from "../src/client/client.js";
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
