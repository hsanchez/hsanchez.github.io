const origin = "https://cv-access.huascar-sanchez.workers.dev";
const gate = await fetch(origin + "/", { signal: AbortSignal.timeout(15000) });
const html = await gate.text();
if (gate.status !== 200 || !html.includes('data-sitekey="0x4AAAAAAF0E4SLI-R_Zy6wG"') ||
    html.includes("protected-cv-content:start")) {
  throw new Error("The deployed CV verification page is not ready");
}
const rejected = await fetch(origin + "/verify", {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
  body: "cf-turnstile-response=invalid-deployment-smoke-test",
  signal: AbortSignal.timeout(15000),
});
if (rejected.status !== 403 || (await rejected.text()).includes("protected-cv-content:start")) {
  throw new Error("The deployed Worker did not reject an invalid verification token");
}
console.log("CV Worker is ready and rejects invalid verification tokens.");
