import assert from "node:assert/strict";
import test from "node:test";
import { antigravityFetch } from "../src/utils/http.js";

test("retry cancels the discarded response body before reusing the pool", async () => {
  const originalFetch = globalThis.fetch;
  process.env.ANTIGRAVITY_NO_KEEPALIVE = "1";
  let calls = 0;
  let cancelled = false;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) {
      return new Response(
        new ReadableStream({
          cancel() {
            cancelled = true;
          },
        }),
        { status: 429, headers: { "retry-after": "0.001" } },
      );
    }
    return new Response("ok", { status: 200 });
  };

  try {
    const response = await antigravityFetch("https://example.test", {}, 1);
    assert.equal(response.status, 200);
    assert.equal(calls, 2);
    assert.equal(cancelled, true);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.ANTIGRAVITY_NO_KEEPALIVE;
  }
});
