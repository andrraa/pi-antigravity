import { AsyncLocalStorage } from "node:async_hooks";
import { redactSecrets } from "../utils/security.js";
const storage = new AsyncLocalStorage();
/** Last completed request snapshot for `/antigravity.doctor`. */
let lastSnapshot = {};
function currentBag() {
    return storage.getStore() ?? lastSnapshot;
}
/** Run work with an isolated diagnostics bag; commits it to `lastSnapshot` when done. */
export async function runWithDiagnostics(fn) {
    const bag = {};
    return storage.run(bag, async () => {
        try {
            return await fn();
        }
        finally {
            lastSnapshot = { ...bag };
        }
    });
}
export function getLastDiagnostics() {
    return lastSnapshot;
}
/** Read endpoint from the active request bag (or last snapshot outside a request). */
export function getCurrentEndpoint() {
    return currentBag().endpoint;
}
export function getCurrentMatchedModelDebug() {
    return currentBag().matchedModelDebug;
}
export function getCurrentAvailableModels() {
    return currentBag().availableModels;
}
export function setLastStatus(status) {
    currentBag().status = status;
}
export function setLastEndpoint(endpoint) {
    currentBag().endpoint = endpoint;
}
export function setLastError(error) {
    currentBag().error = error === undefined ? undefined : redactSecrets(error).slice(0, 800);
}
export function setLastProjectId(projectId) {
    currentBag().projectId = projectId;
}
export function setLastResolvedRuntimeModel(model) {
    currentBag().resolvedRuntimeModel = model;
}
export function setLastAvailableModels(models) {
    currentBag().availableModels = models;
}
export function setLastMatchedModelDebug(debug) {
    currentBag().matchedModelDebug =
        debug === undefined ? undefined : redactSecrets(debug).slice(0, 1200);
}
export function setLastLatencyMs(ms) {
    currentBag().latencyMs = ms;
}
export function setLastMaskedEmail(email) {
    currentBag().maskedEmail = email;
}
export function setLastTokenExpiry(expiry) {
    currentBag().tokenExpiry = expiry;
}
/** Test helper: reset last snapshot between cases. */
export function resetDiagnosticsForTests() {
    lastSnapshot = {};
}
