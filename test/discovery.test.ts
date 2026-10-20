import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseAgentModels } from "../src/models/discovery.js";

test("agent catalog includes disabled, excludes Leaving Soon and non-agent entries", () => {
  const models = parseAgentModels({
    agentModelSorts: [{ groups: [{ modelIds: ["active", "disabled", "old", "active", "missing"] }] }],
    models: {
      active: { displayName: "Active", supportsThinking: true },
      disabled: { displayName: "Argon", disabled: true },
      old: { tagTitle: "Leaving Soon" },
      image: { displayName: "Image" },
    },
  });
  assert.deepEqual(models.map(m => m.id), ["active", "disabled"]);
  assert.equal(models[1].name, "Argon [Unavailable]");
  assert.throws(() => parseAgentModels({ models: {} }), /missing agent model groups/);
});
