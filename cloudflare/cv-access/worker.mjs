// Turnstile gate. The build supplies the rendered CV from its single source.
const HOSTNAME = "cv-access.huascar-sanchez.workers.dev";
const ORIGIN = "https://" + HOSTNAME;
const SITE_ORIGIN = "https://huascarsanchez.com";
const CV_PATHS = new Set(["/notes/cv.html", "/posts/notes/cv.html", "/posts/notes/cv"]);
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

function gate(message = "", status = 200, formAction = "/verify") {
  const nonce = crypto.randomUUID();
  return new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Curriculum Vitae — Huascar Sanchez</title>
<link href="https://huascarsanchez.com/static/favicon.ico" rel="icon">
<link href="https://huascarsanchez.com/static/style.css?v=post-date-20261016" rel="stylesheet">
<style>
.container { min-width: 0; }
.cv-access { margin: 2rem 0 4rem; line-height: 1.6; }
.cv-challenge { margin-top: 2rem; min-height: 65px; }
.cv-message:empty { display: none; }
.cv-submit {
  background: transparent; border: 0; color: inherit; cursor: pointer;
  font: inherit; padding: 0; text-decoration: underline;
}
.cv-submit:hover, .cv-submit:focus-visible { text-decoration-thickness: 2px; }
.cv-submit:focus-visible { outline: 1px dotted currentColor; outline-offset: .3rem; }
.cv-submit:disabled { cursor: default; opacity: .45; }
#status { min-height: 1.6em; margin: 1rem 0; font-size: 1.3rem; }
.cv-footer { display: flow-root; margin-top: 4rem; }
.cv-footer .col { max-width: 100%; }
@media (max-width: 380px) { body { padding-left: 1rem; padding-right: 1rem; } }
</style>
</head>
<body>
<script nonce="${nonce}">
try {
  if (window.localStorage.getItem("site-theme") === "dark") {
    document.body.classList.add("theme-dark");
  }
} catch (error) {}
</script>
<div class="container">
  <header>
    <div class="site-tools">
      <button class="theme-toggle" type="button" aria-pressed="false"
        aria-label="Switch to dark theme" title="Switch to dark theme">dark mode</button>
    </div>
    <nav aria-label="Breadcrumb">
      <ul id="breadcrumb">
        <li><a href="https://huascarsanchez.com/">home</a></li>
        <li><a href="https://huascarsanchez.com/posts">posts</a></li>
        <li><a href="https://huascarsanchez.com/posts/notes">notes</a></li>
      </ul>
    </nav>
    <h1 class="title">Curriculum Vitae</h1>
  </header>
  <main class="content cv-access">
    <p>Please complete the check below to view my CV.</p>
    <p class="cv-message" role="alert">${message}</p>
    <form method="post" action="${formAction}">
      <div id="cv-challenge" class="cv-challenge" data-sitekey="${SITE_KEY}"></div>
      <p id="status" role="status" aria-live="polite"></p>
      <button id="submit" class="cv-submit" type="submit" disabled>View CV</button>
    </form>
    <noscript><p>This verification needs JavaScript. You can also contact me through my website.</p></noscript>
  </main>
  <footer class="cv-footer">
    <div class="col"><h3>Follow Me</h3><ul>
      <li><a href="https://twitter.com/intent/user?screen_name=huascarsanchez">Twitter</a></li>
      <li><a href="https://github.com/hsanchez">Github</a></li>
      <li><a href="https://www.linkedin.com/in/huascarsanchez">LinkedIn</a></li>
    </ul></div>
    <div class="col"><h3>Check out</h3><ul>
      <li><a href="https://huascarsanchez.com/">Home</a></li>
      <li><a href="https://huascarsanchez.com/posts">Posts</a></li>
    </ul></div>
    <div class="col"><h3>Learn More</h3><ul>
      <li><a href="https://huascarsanchez.com/posts/thesiswork">PhD Work</a></li>
      <li><a href="https://huascarsanchez.com/posts/notes/pubs.html">Publications</a></li>
      <li><a href="https://speakerdeck.com/hsanchez">Slides</a></li>
    </ul></div>
  </footer>
</div>
<script nonce="${nonce}">
(function () {
  var toggle = document.querySelector(".theme-toggle");
  var submit = document.getElementById("submit");
  var status = document.getElementById("status");
  var widgetId = null;

  function isDark() {
    return document.body.classList.contains("theme-dark");
  }

  function updateToggle() {
    var dark = isDark();
    var label = dark ? "Switch to light theme" : "Switch to dark theme";
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
    toggle.textContent = dark ? "light mode" : "dark mode";
  }

  function renderChallenge() {
    submit.disabled = true;
    status.textContent = "";
    if (!window.turnstile) return;
    if (widgetId !== null) window.turnstile.remove(widgetId);
    widgetId = window.turnstile.render("#cv-challenge", {
      sitekey: "${SITE_KEY}",
      action: "${ACTION}",
      theme: isDark() ? "dark" : "light",
      size: "flexible",
      callback: function () {
        submit.disabled = false;
        status.textContent = "Verification complete.";
      },
      "expired-callback": function () {
        submit.disabled = true;
        status.textContent = "Verification expired. Please verify again.";
      },
      "error-callback": function () {
        submit.disabled = true;
        status.textContent = "Verification could not load. Please reload this page.";
      }
    });
  }

  updateToggle();
  toggle.addEventListener("click", function () {
    document.body.classList.toggle("theme-dark");
    updateToggle();
    try {
      window.localStorage.setItem("site-theme", isDark() ? "dark" : "light");
    } catch (error) {}
    renderChallenge();
  });
  window.onTurnstileReady = renderChallenge;
})();
</script>
<script nonce="${nonce}" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&amp;onload=onTurnstileReady" async defer></script>
</body>
</html>`, {
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
      if (url.origin !== ORIGIN && url.origin !== SITE_ORIGIN) {
        return new Response("Not found", { status: 404, headers: headers() });
      }
      const onMainSite = url.origin === SITE_ORIGIN;
      const isCVPath = onMainSite && CV_PATHS.has(url.pathname);
      const formAction = isCVPath ? url.pathname : "/verify";
      const renderGate = (message = "", status = 200) => gate(message, status, formAction);
      if ((isCVPath || (!onMainSite && url.pathname === "/")) &&
          (request.method === "GET" || request.method === "HEAD")) {
        const response = env.TURNSTILE_SECRET_KEY
          ? renderGate()
          : renderGate("Verification is temporarily unavailable. Please try again later.", 503);
        return request.method === "HEAD"
          ? new Response(null, { status: response.status, headers: response.headers })
          : response;
      }
      if (!isCVPath && (onMainSite || url.pathname !== "/verify")) {
        return new Response("Not found", { status: 404, headers: headers() });
      }
      if (request.method !== "POST") {
        return new Response("Method not allowed", {
          status: 405, headers: { ...headers(), Allow: "POST" },
        });
      }
      if (!env.TURNSTILE_SECRET_KEY) {
        return renderGate("Verification is temporarily unavailable. Please try again later.", 503);
      }
      if (request.headers.get("Origin") !== url.origin) {
        return renderGate("Please start the verification again from this page.", 403);
      }
      const contentType = request.headers.get("Content-Type") || "";
      if (contentType.split(";")[0].trim().toLowerCase() !== "application/x-www-form-urlencoded") {
        return renderGate("Please use the verification form.", 415);
      }
      let text;
      try {
        text = await limitedText(request);
      } catch {
        return renderGate("The form could not be read. Please try again.", 400);
      }
      if (text === null) return renderGate("The form is too large. Please try again.", 413);
      const tokens = new URLSearchParams(text).getAll("cf-turnstile-response");
      if (tokens.length !== 1 || !tokens[0] || tokens[0].length > 2048) {
        return renderGate("Please complete the verification before continuing.", 400);
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
        return renderGate("Verification is temporarily unavailable. Please try again.", 503);
      }
      if (!result || result.success !== true || result.hostname !== url.hostname || result.action !== ACTION) {
        return renderGate("Verification failed or expired. Please complete a new check.", 403);
      }
      return new Response(CV_HTML, {
        headers: headers("'unsafe-inline' https://huascarsanchez.com https://www.googletagmanager.com"),
      });
    },
  };
}
