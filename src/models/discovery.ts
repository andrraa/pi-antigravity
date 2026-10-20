import type { ProviderModelConfig } from "@earendil-works/pi-coding-agent";
import type { RefreshModelsContext } from "@earendil-works/pi-ai";
import { getApiKey } from "../auth/oauth.js";
import { antigravityHeaders, endpointCandidates, parseApiKey } from "../client/client.js";
import { antigravityFetch } from "../utils/http.js";
import { isRecord } from "../utils/util.js";

/** Agent membership is authoritative; disabled entries remain visible by user choice. */
export function parseAgentModels(data: unknown): ProviderModelConfig[] {
  if (!isRecord(data) || !isRecord(data.models) || !Array.isArray(data.agentModelSorts)) {
    throw new Error("Antigravity discovery is missing agent model groups");
  }
  const ids = new Set<string>();
  for (const sort of data.agentModelSorts) {
    if (!isRecord(sort) || !Array.isArray(sort.groups)) continue;
    for (const group of sort.groups) {
      if (!isRecord(group) || !Array.isArray(group.modelIds)) continue;
      for (const id of group.modelIds) if (typeof id === "string") ids.add(id);
    }
  }
  const models: ProviderModelConfig[] = [];
  for (const id of ids) {
    const info = data.models[id];
    if (!isRecord(info) || /leaving\s+soon/i.test(String(info.tagTitle ?? ""))) continue;
    if (info.isInternal === true) continue;
    const name = typeof info.displayName === "string" ? info.displayName : id;
    models.push({
      id,
      name: `${name}${info.disabled === true ? " [Unavailable]" : ""}`,
      headers: { "X-Pi-Antigravity-Runtime-Id": id },
      reasoning: info.supportsThinking === true,
      input: info.supportsImages === true ? ["text", "image"] : ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      // shortcut: conservative limits when metadata omits them; refine when verified limits exist.
      contextWindow: typeof info.maxInputTokens === "number" && info.maxInputTokens > 0 ? info.maxInputTokens : 131072,
      maxTokens: typeof info.maxOutputTokens === "number" && info.maxOutputTokens > 0 ? info.maxOutputTokens : 8192,
    });
  }
  return models;
}

export async function refreshAgentModels(ctx: RefreshModelsContext): Promise<ProviderModelConfig[]> {
  if (!ctx.allowNetwork || !ctx.credential) return [];
  const key = ctx.credential.type === "oauth" ? getApiKey(ctx.credential) : ctx.credential.key;
  const { token, projectId } = parseApiKey(key);
  for (const endpoint of endpointCandidates()) {
    const response = await antigravityFetch(`${endpoint}/v1internal:fetchAvailableModels`, {
      method: "POST",
      headers: { ...antigravityHeaders(token), Accept: "application/json" },
      body: JSON.stringify({ project: projectId }),
      signal: ctx.signal,
    });
    if (!response.ok) { await response.body?.cancel(); continue; }
    return parseAgentModels(await response.json());
  }
  throw new Error("Antigravity agent catalog discovery failed");
}
