import test from "node:test";
import assert from "node:assert/strict";
import { createWorker } from "../cloudflare/cv-access/worker.mjs";
const worker = createWorker("<!doctype html><html><head><script src=\"https://www.googletagmanager.com/gtag/js?id=G-SPEBXM9HSP\"></script></head><body><h1>Huascar Sanchez</h1><p>Research Summary and Skills</p></body></html>");

const origin = "https://cv-access.huascar-sanchez.workers.dev";
const env = { TURNSTILE_SECRET_KEY: "test-only-secret" };
const originalFetch = globalThis.fetch;
const success = { success: true, hostname: new URL(origin).hostname, action: "view_cv" };

function post(body = "cf-turnstile-response=test-token", overrides = {}) {
  return new Request(origin + "/verify", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded", ...overrides },
    body,
  });
}
async function noCV(response, expectedStatus) {
  assert.equal(response.status, expectedStatus);
  const text = await response.text();
  assert.ok(!text.includes("Research Summary and Skills"), "CV must not leak");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
}

test("CV access boundary", async (t) => {
  try {
    await t.test("gate and direct paths never disclose CV", async () => {
      for (const [path, code] of [["/", 200], ["/cv", 404], ["/worker.mjs", 404], ["/verify", 405]]) {
        await noCV(await worker.fetch(new Request(origin + path), env), code);
      }
      await noCV(await worker.fetch(new Request("https://wrong.example/"), env), 404);
      const head = await worker.fetch(new Request(origin + "/", { method: "HEAD" }), env);
      assert.equal(await head.text(), "");
    });
    await t.test("rejects missing secret, foreign origin, malformed or oversized forms before API", async () => {
      globalThis.fetch = async () => { throw new Error("Unexpected API call"); };
      await noCV(await worker.fetch(post(), {}), 503);
      await noCV(await worker.fetch(new Request(origin + "/"), {}), 503);
      await noCV(await worker.fetch(post(undefined, { Origin: "https://other.example" }), env), 403);
      await noCV(await worker.fetch(post("", {}), env), 400);
      await noCV(await worker.fetch(post("cf-turnstile-response=a&cf-turnstile-response=b"), env), 400);
      await noCV(await worker.fetch(post("x=" + "a".repeat(5000)), env), 413);
      await noCV(await worker.fetch(post("{}", { "Content-Type": "application/json" }), env), 415);
    });
    await t.test("invalid tokens and wrong hostname/action do not disclose CV", async () => {
      for (const result of [
        { success: false, "error-codes": ["timeout-or-duplicate"] },
        { ...success, hostname: "other.example" },
        { ...success, action: "other_action" },
        { ...success, success: "true" },
        null,
      ]) {
        globalThis.fetch = async () => Response.json(result);
        await noCV(await worker.fetch(post(), env), 403);
      }
    });
    await t.test("verification service failures fail closed", async () => {
      globalThis.fetch = async () => { throw new Error("Network failure"); };
      await noCV(await worker.fetch(post(), env), 503);
      globalThis.fetch = async () => new Response("bad gateway", { status: 502 });
      await noCV(await worker.fetch(post(), env), 503);
      globalThis.fetch = async () => new Response("not JSON");
      await noCV(await worker.fetch(post(), env), 503);
    });
    await t.test("successful verification serves full CV without caching", async () => {
      globalThis.fetch = async (url, init) => {
        assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
        const sent = JSON.parse(init.body);
        assert.equal(sent.secret, env.TURNSTILE_SECRET_KEY);
        assert.equal(sent.response, "test-token");
        return Response.json(success);
      };
      const response = await worker.fetch(post(), env);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
      assert.equal(response.headers.get("CDN-Cache-Control"), "no-store");
      assert.match(response.headers.get("Content-Security-Policy"), /script-src.*https:\/\/www\.googletagmanager\.com/);
      const html = await response.text();
      assert.ok(html.includes("Research Summary and Skills"));
      assert.ok(html.includes("Huascar Sanchez"));
      assert.ok(!html.includes("test-only-secret"));
      assert.ok(!html.includes("# Huascar Sanchez"));
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
