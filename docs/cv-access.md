# Protected CV deployment

Keep editing `posts/notes/_posts/2017-02-01-cv.md`. That is the only CV source
to maintain. Push to `master` to publish the website and update the Worker together.

The default Jekyll build renders a link at `/posts/notes/cv.html`.
The workflow separately renders the CV using the existing layout, scripts and
Google Analytics tag, then bundles that HTML into the `cv-access` Worker.
No generated CV copy needs to be committed or pasted into Cloudflare.

## One-time setup

The `cv-access` Worker and Turnstile widget already exist. Keep the existing
`TURNSTILE_SECRET_KEY` secret in the Worker's Settings → Variables and Secrets.
Wrangler preserves it on deployment; it does not need to be copied into GitHub.

Create a Cloudflare API token using the **Edit Cloudflare Workers** template,
restricted to your account. For this workers.dev deployment, you do not need
permission to edit your website's DNS or zone routes.

In the GitHub repository, open Settings → Secrets and variables → Actions,
then add these **repository secrets**:

- `CLOUDFLARE_API_TOKEN`: the deployment token.
- `CLOUDFLARE_ACCOUNT_ID`: the account ID shown in Cloudflare's account/Worker dashboard.

Do not add either value to source files or paste the token into chat.

The existing GitHub Pages workflow now deploys the Worker, checks that its
verification page is ready and rejects an invalid token, then publishes the
website. Missing credentials or a failed Worker check stop the workflow before
the website is replaced. The Turnstile site key is public and lives in
`cloudflare/cv-access/worker.mjs`.

After the first deployment, open
https://huascarsanchez.com/notes/cv.html in a normal browser and complete
the challenge. Confirm the CV, links, theme toggle, and analytics load.
Also check https://huascarsanchez.com/posts/notes/cv.html shows only the access
link, and the old `/static/wip.cv.pdf` and `/static/wip.resume.pdf` URLs return 404.

## Build and checks

The workflow runs these steps automatically:

1. `node --test tests/cv-worker.test.mjs tests/cv-build.test.mjs tests/cv-deploy.test.mjs`
2. `node scripts/build-cv-worker.mjs prepare`
3. Jekyll build from `_cv-build/source` to `_cv-build/rendered`
4. `node scripts/build-cv-worker.mjs bundle`
5. Normal Jekyll build to `_site`
6. `node scripts/build-cv-worker.mjs verify-public`
7. Wrangler deploy and `node scripts/check-cv-worker.mjs`

The public artifact is checked for the private CV marker and excludes the
Worker source, build scripts, tests, documentation and old CV/resume PDFs.
Only `_site` is uploaded to GitHub Pages. `_cv-build` is ignored by Git.

The Worker validates Turnstile tokens server-side, including their hostname
and action. It serves the CV in the successful POST response with caching
disabled. No login, separate CV storage, or session cookie is needed.
Reloading may require a new verification.

## Scope of protection

This gates the website's CV view. The CV Markdown, older PDFs, and Git history
remain accessible if this repository is public. Turnstile does not prevent
visitors who pass verification from saving or sharing the CV.

The protected CV keeps the site's existing Google Analytics tag. Ordinary
website analytics are unchanged. Analytics does not establish a visitor's
identity, and metrics may be blocked by browser privacy settings.

## References

- [Cloudflare Workers GitHub Actions deployment](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Wrangler configuration and secret preservation](https://developers.cloudflare.com/workers/wrangler/configuration/#source-of-truth)

## Serve the CV on the main domain

The Worker also accepts GET and POST on `https://huascarsanchez.com/notes/cv.html`
(and the older `/posts/notes/cv.html` path). The form posts to the same path,
so successful verification keeps the main-domain address in the browser.

In Cloudflare, add `huascarsanchez.com` to the existing Turnstile widget's
hostnames. Under Workers & Pages → cv-access → Settings → Domains & Routes,
add a **Route**, select the `huascarsanchez.com` zone, and enter:
`huascarsanchez.com/notes/cv.html*`.

The domain's DNS record must be proxied (orange cloud). This is a path route,
not a custom domain for the entire website. Leave the existing GitHub Pages
DNS destination in place.

Routes are managed in the Cloudflare dashboard. The Wrangler configuration
intentionally has no `routes` entry; deployments preserve the dashboard routes.
The GitHub token does not need additional route permissions.

The route and Turnstile hostname are configured. The public CV link and deployment
health check both use `https://huascarsanchez.com/notes/cv.html`.
The workers.dev address remains available as a fallback.
