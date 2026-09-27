import assert from "node:assert/strict";
import test from "node:test";
import type { Api, Context, Model, Tool } from "@earendil-works/pi-ai";
import {
  convertMessages,
  convertTools,
  friendlyAntigravityError,
  mapStopReason,
} from "../src/stream/stream.js";

const model = { id: "gemini-3.7-flash" } as Model<Api>;

test("convertTools dereferences schemas and limits legacy tool fields", () => {
  const tool = {
    name: "lookup",
    description: "Look something up",
    parameters: {
      $defs: {
        Query: { type: ["string", "null"], format: "email", nullable: true },
      },
      type: "object",
      properties: { query: { $ref: "#/$defs/Query" } },
      required: ["query"],
    },
  } as unknown as Tool;

  assert.deepEqual(convertTools([tool], true), [
    {
      functionDeclarations: [
        {
          name: "lookup",
          description: "Look something up",
          parameters: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
          },
        },
      ],
    },
  ]);
  assert.equal(convertTools(undefined), undefined);
});

test("convertMessages prepends the required user turn and maps tool results", () => {
  const context = {
    messages: [
      {
        role: "assistant",
        provider: "antigravity",
        model: model.id,
        content: [{ type: "text", text: "Ready" }],
      },
      {
        role: "toolResult",
        toolName: "lookup",
        toolCallId: "call-1",
        isError: true,
        content: [{ type: "text", text: "not found" }],
      },
    ],
  } as unknown as Context;

  assert.deepEqual(convertMessages(model, context, "gemini-3.7-flash-tiered"), [
    { role: "user", parts: [{ text: "Hello" }] },
    { role: "model", parts: [{ text: "Ready" }] },
    {
      role: "user",
      parts: [
        {
          functionResponse: {
            name: "lookup",
            response: { error: "not found" },
          },
        },
      ],
    },
  ]);
});

test("stop reasons and backend errors are normalized", () => {
  assert.equal(mapStopReason("STOP"), "stop");
  assert.equal(mapStopReason("MAX_TOKENS"), "length");
  assert.equal(mapStopReason("SAFETY"), "error");
  assert.equal(mapStopReason(undefined), "stop");
  assert.match(friendlyAntigravityError(401, "ignored"), /login antigravity/);
  assert.match(
    friendlyAntigravityError(429, "Individual quota reached. Resets in 2 hours."),
    /2 hours/,
  );
});
