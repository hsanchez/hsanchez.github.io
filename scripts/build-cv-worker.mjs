import { cp, mkdir, readFile, readdir, writeFile, stat } from "node:fs/promises";
import { dirname, resolve, join, extname } from "node:path";
import { pathToFileURL } from "node:url";

export const CV_SOURCE = "posts/notes/_posts/2017-02-01-cv.md";
export const CV_PAGE = "posts/notes/cv.html";
export const SITE_ORIGIN = "https://huascarsanchez.com";
export const WORKER_ORIGIN = "https://cv-access.huascar-sanchez.workers.dev";
export const CONTENT_MARKER = "protected-cv-content:start";

export async function prepare(root) {
  const source = join(root, "_cv-build/source");
  await mkdir(source, { recursive: true });
  for (const dir of ["_layouts", "_includes"]) {
    await cp(join(root, dir), join(source, dir), { recursive: true });
  }
  await mkdir(dirname(join(source, CV_SOURCE)), { recursive: true });
  await cp(join(root, CV_SOURCE), join(source, CV_SOURCE));
  const config = await readFile(join(root, "_config.yml"), "utf8");
  if (!config.includes("cv_worker_build: false")) {
    throw new Error("Expected public CV build to be disabled in _config.yml");
  }
  await writeFile(join(source, "_config.yml"),
    config.replace("cv_worker_build: false", "cv_worker_build: true"));
}

// Root-relative assets and navigation must keep pointing at the main website.
// Preserve fragment links and protocol-relative URLs.
export function absolutize(html) {
  return html.replace(/\b(href|src|action)=(["'])(\/(?!\/)[^"']*)\2/gi,
    (_match, attr, quote, path) => attr + "=" + quote + SITE_ORIGIN + path + quote);
}

export async function bundle(root) {
  const rendered = await readFile(join(root, "_cv-build/rendered", CV_PAGE), "utf8");
  if (!rendered.includes(CONTENT_MARKER) || rendered.includes("{%")) {
    throw new Error("Private CV was not rendered correctly; refusing to bundle");
  }
  const html = absolutize(rendered);
  await writeFile(join(root, "_cv-build/worker.mjs"),
    'import { createWorker } from "../cloudflare/cv-access/worker.mjs";\n' +
    "export default createWorker(" + JSON.stringify(html) + ");\n");
}

export async function verifyPublic(root) {
  const site = join(root, "_site");
  const cv = await readFile(join(site, CV_PAGE), "utf8");
  if (!cv.includes(WORKER_ORIGIN)) throw new Error("Public CV must link to the Worker");
  for (const path of ["static/wip.cv.pdf", "static/wip.resume.pdf", "cloudflare", "scripts", "tests", "_cv-build"]) {
    try {
      await stat(join(site, path));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    throw new Error("Private or build-only file in public artifact: " + path);
  }
  async function scan(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await scan(path);
      else if ([".html", ".xml", ".json", ".md", ".mjs", ".js", ".txt"].includes(extname(path))) {
        const text = await readFile(path, "utf8");
        if (text.includes(CONTENT_MARKER)) throw new Error("CV content leaked into " + path);
      }
    }
  }
  await scan(site);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const command = { prepare, bundle, "verify-public": verifyPublic }[process.argv[2]];
  if (!command) throw new Error("Usage: node scripts/build-cv-worker.mjs prepare|bundle|verify-public");
  await command(process.cwd());
}
