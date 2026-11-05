import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout } from "node:timers/promises";

const origin = "https://huascarsanchez.com";
const cvPath = "/notes/cv.html";
const cvUrl = origin + cvPath;

export async function checkWorker(fetcher = fetch) {
  const gate = await fetcher(cvUrl, { signal: AbortSignal.timeout(15000) });
  const html = await gate.text();
  if (gate.status !== 200 || gate.redirected || !html.includes('action="/notes/cv.html"') || gate.headers.get("Referrer-Policy") !== "same-origin" || !html.includes('data-sitekey="0x4AAAAAAF0E4SLI-R_Zy6wG"') ||
      html.includes("protected-cv-content:start")) {
    throw new Error("The deployed CV verification page is not ready (HTTP " + gate.status + ")");
  }
  const rejected = await fetcher(cvUrl, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: "cf-turnstile-response=invalid-deployment-smoke-test",
    signal: AbortSignal.timeout(15000),
  });
  if (rejected.status !== 403 || (await rejected.text()).includes("protected-cv-content:start")) {
    throw new Error("The deployed Worker did not reject an invalid verification token");
  }
}

// Worker updates can take a few seconds to become visible at every edge.
export async function waitForWorker(check = checkWorker, attempts = 6, pause = () => setTimeout(3000)) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await check();
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      console.log("CV Worker is not ready yet; retrying (" + attempt + "/" + attempts + ").");
      await pause();
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await waitForWorker();
  console.log("CV Worker is ready and rejects invalid verification tokens.");
}
