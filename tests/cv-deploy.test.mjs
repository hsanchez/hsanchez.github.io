import test from "node:test";
import assert from "node:assert/strict";
import { checkWorker, waitForWorker } from "../scripts/check-cv-worker.mjs";

test("deployment waits for edge propagation", async () => {
  let checks = 0;
  await waitForWorker(async () => {
    if (++checks < 3) throw new Error("Old Worker");
  }, 3, async () => {});
  assert.equal(checks, 3);
});

test("an unhealthy deployment stays blocked after retries", async () => {
  await assert.rejects(waitForWorker(async () => {
    throw new Error("Not ready");
  }, 2, async () => {}), /Not ready/);
});

test("live check requires the gate and rejection of invalid tokens", async () => {
  const gate = () => new Response('<div data-sitekey="0x4AAAAAAF0E4SLI-R_Zy6wG"></div>', {
    headers: { "Referrer-Policy": "same-origin" },
  });
  await checkWorker(async (_url, options) => options.method === "POST"
    ? new Response("Rejected", { status: 403 }) : gate());
  await assert.rejects(checkWorker(async () => new Response("Hello World!")), /not ready/);
  await assert.rejects(checkWorker(async () => new Response(
    '<div data-sitekey="0x4AAAAAAF0E4SLI-R_Zy6wG"></div>',
    { headers: { "Referrer-Policy": "no-referrer" } }
  )), /not ready/);
  await assert.rejects(checkWorker(async () => gate()), /did not reject/);
});
