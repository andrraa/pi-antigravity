import { randomUUID } from "node:crypto";

export function antigravityEnv(name: string): string | undefined {
  return process.env[`ANTIGRAVITY_${name}`] || process.env[`NOAGY_${name}`];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export function sanitizeText(text: unknown): string {
  return String(text ?? "").replace(/[\uD800-\uDFFF]/g, "\uFFFD");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const requestTrajectoryId = randomUUID();
let requestStep = 0;

/**
 * Request id in the official CLI's `agent/<trajectory>/<ms>/<step-uuid>/<step>` shape.
 * One trajectory per process groups a conversation's turns the way the CLI does;
 * `step` increments per request so retries stay distinguishable.
 */
export function nextAgentRequestId(): string {
  return `agent/${requestTrajectoryId}/${Date.now()}/${randomUUID()}/${++requestStep}`;
}
