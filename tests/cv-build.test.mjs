import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { prepare, bundle, verifyPublic, absolutize, CV_SOURCE, CV_PAGE, CONTENT_MARKER, WORKER_ORIGIN } from "../scripts/build-cv-worker.mjs";

const repo = fileURLToPath(new URL("../", import.meta.url));
test("single-source CV build stays out of public artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "cv-build-test-"));
  try {
    for (const dir of ["_layouts", "_includes"]) {
      await cp(join(repo, dir), join(root, dir), { recursive: true });
    }
    await cp(join(repo, "_config.yml"), join(root, "_config.yml"));
    await mkdir(dirname(join(root, CV_SOURCE)), { recursive: true });
    await cp(join(repo, CV_SOURCE), join(root, CV_SOURCE));
    const original = await readFile(join(root, CV_SOURCE), "utf8");
    await prepare(root);
    assert.equal(await readFile(join(root, CV_SOURCE), "utf8"), original);
    assert.ok((await readFile(join(root, "_cv-build/source", CV_SOURCE), "utf8")).includes(CONTENT_MARKER));
    assert.ok((await readFile(join(root, "_cv-build/source/_config.yml"), "utf8")).includes("cv_worker_build: true"));
    assert.ok((await readFile(join(root, "_config.yml"), "utf8")).includes("cv_worker_build: false"));

    const privatePage = join(root, "_cv-build/rendered", CV_PAGE);
    await mkdir(dirname(privatePage), { recursive: true });
    await writeFile(privatePage, '<html><!-- ' + CONTENT_MARKER + ' --><link href="/static/style.css"><h1>Private CV</h1></html>');
    await bundle(root);
    const worker = await readFile(join(root, "_cv-build/worker.mjs"), "utf8");
    assert.ok(worker.includes("Private CV"));
    assert.ok(worker.includes("https://huascarsanchez.com/static/style.css"));
    await writeFile(privatePage, "<html>Missing private build flag</html>");
    await assert.rejects(bundle(root), /not rendered correctly/);

    const publicPage = join(root, "_site", CV_PAGE);
    await mkdir(dirname(publicPage), { recursive: true });
    await writeFile(publicPage, '<a href="' + WORKER_ORIGIN + '">View CV</a>');
    await verifyPublic(root);
    await writeFile(join(root, "_site/atom.xml"), "<entry>" + CONTENT_MARKER + "</entry>");
    await assert.rejects(verifyPublic(root), /leaked/);
    await rm(join(root, "_site/atom.xml"));
    await mkdir(join(root, "_site/static"), { recursive: true });
    await writeFile(join(root, "_site/static/wip.cv.pdf"), "public CV PDF");
    await assert.rejects(verifyPublic(root), /build-only file/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("links resolve against the existing website without changing fragments or external URLs", () => {
  const html = '<a href="/">home</a><script src="/static/app.js"></script><a href="#education">jump</a><a href="//example.com">external</a>';
  const result = absolutize(html);
  assert.ok(result.includes('href="https://huascarsanchez.com/"'));
  assert.ok(result.includes('src="https://huascarsanchez.com/static/app.js"'));
  assert.ok(result.includes('href="#education"'));
  assert.ok(result.includes('href="//example.com"'));
});
