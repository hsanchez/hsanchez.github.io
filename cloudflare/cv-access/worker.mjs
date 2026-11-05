// Turnstile gate. The build supplies the rendered CV from its single source.
const HOSTNAME = "cv-access.huascar-sanchez.workers.dev";
const ORIGIN = "https://" + HOSTNAME;
const SITE_KEY = "0x4AAAAAAF0E4SLI-R_Zy6wG";
const ACTION = "view_cv";
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_FORM_BYTES = 4096;

function headers(scriptPolicy = "'none'") {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "private, no-store",
    "CDN-Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "Content-Security-Policy": "default-src 'none'; script-src " + scriptPolicy +
      "; style-src 'unsafe-inline' https://huascarsanchez.com; img-src https://huascarsanchez.com data:;" +
      " frame-src https://challenges.cloudflare.com;" +
      " connect-src https://challenges.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com;" +
      " form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'",
  };
}

function gate(message = "", status = 200) {
  const nonce = crypto.randomUUID();
  return new Response(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>View CV — Huascar Sanchez</title>
<style>
:root{color-scheme:light dark}
body{font:16px/1.6 Courier,monospace;max-width:38rem;margin:12vh auto;padding:0 1.5rem}
h1{font-size:1.3rem}a{color:inherit}
button{font:inherit;padding:.6rem 1rem;margin-top:1rem;cursor:pointer}
button:disabled{cursor:wait;opacity:.55}
#status{min-height:1.6em}
</style>
<script nonce="${nonce}">
window.onVerified = function () {
  document.getElementById("submit").disabled = false;
  document.getElementById("status").textContent = "Verification complete.";
};
window.onExpired = function () {
  document.getElementById("submit").disabled = true;
  document.getElementById("status").textContent = "Verification expired. Please verify again.";
};
window.onError = function () {
  document.getElementById("submit").disabled = true;
  document.getElementById("status").textContent = "Verification could not load. Please reload this page.";
};
</script>
<script nonce="${nonce}" src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head><body>
<p><a href="https://huascarsanchez.com/">← Home</a></p>
<h1>Huascar Sanchez — CV</h1>
<p>Please complete the check below to view my CV.</p>
<p role="alert">${message}</p>
<form method="post" action="/verify">
<div class="cf-turnstile" data-sitekey="${SITE_KEY}" data-action="${ACTION}"
 data-callback="onVerified" data-expired-callback="onExpired" data-error-callback="onError"></div>
<p id="status" role="status" aria-live="polite"></p>
<button id="submit" type="submit" disabled>View CV</button>
</form>
<noscript><p>This verification needs JavaScript. You can also contact me through my website.</p></noscript>
</body></html>`, {
    status,
    headers: headers("'nonce-" + nonce + "' https://challenges.cloudflare.com"),
  });
}

async function limitedText(request) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FORM_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(all);
}

export function createWorker(CV_HTML) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.origin !== ORIGIN) {
        return new Response("Not found", { status: 404, headers: headers() });
      }
      if (url.pathname === "/" && (request.method === "GET" || request.method === "HEAD")) {
        const response = env.TURNSTILE_SECRET_KEY
          ? gate()
          : gate("Verification is temporarily unavailable. Please try again later.", 503);
        return request.method === "HEAD"
          ? new Response(null, { status: response.status, headers: response.headers })
          : response;
      }
      if (url.pathname !== "/verify") {
        return new Response("Not found", { status: 404, headers: headers() });
      }
      if (request.method !== "POST") {
        return new Response("Method not allowed", {
          status: 405, headers: { ...headers(), Allow: "POST" },
        });
      }
      if (!env.TURNSTILE_SECRET_KEY) {
        return gate("Verification is temporarily unavailable. Please try again later.", 503);
      }
      if (request.headers.get("Origin") !== ORIGIN) {
        return gate("Please start the verification again from this page.", 403);
      }
      const contentType = request.headers.get("Content-Type") || "";
      if (contentType.split(";")[0].trim().toLowerCase() !== "application/x-www-form-urlencoded") {
        return gate("Please use the verification form.", 415);
      }
      let text;
      try {
        text = await limitedText(request);
      } catch {
        return gate("The form could not be read. Please try again.", 400);
      }
      if (text === null) return gate("The form is too large. Please try again.", 413);
      const tokens = new URLSearchParams(text).getAll("cf-turnstile-response");
      if (tokens.length !== 1 || !tokens[0] || tokens[0].length > 2048) {
        return gate("Please complete the verification before continuing.", 400);
      }
      let result;
      try {
        const response = await fetch(SITEVERIFY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET_KEY,
            response: tokens[0],
            ...(request.headers.get("CF-Connecting-IP")
              ? { remoteip: request.headers.get("CF-Connecting-IP") } : {}),
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error("Verification service unavailable");
        result = await response.json();
      } catch {
        return gate("Verification is temporarily unavailable. Please try again.", 503);
      }
      if (!result || result.success !== true || result.hostname !== HOSTNAME || result.action !== ACTION) {
        return gate("Verification failed or expired. Please complete a new check.", 403);
      }
      return new Response(CV_HTML, {
        headers: headers("'unsafe-inline' https://huascarsanchez.com https://www.googletagmanager.com"),
      });
    },
  };
}
