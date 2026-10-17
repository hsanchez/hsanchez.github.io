// Typeset algorithm blocks after the deferred KaTeX and pseudocode scripts load.
(function () {
  var blocks = document.querySelectorAll(
    ".content pre code.language-algorithm, .content pre.language-algorithm code, " +
      ".content .language-algorithm pre code",
  );
  if (!blocks.length) return;
  if (!window.pseudocode || !window.katex) {
    console.warn("Unable to load algorithm renderer; keeping algorithm source.");
    return;
  }

  var captionCount = 0;
  blocks.forEach(function (code) {
    var pre = code.closest("pre");
    try {
      var container = document.createElement("div");
      container.className = "post-algorithm";
      container.innerHTML = window.pseudocode.renderToString(code.textContent, {
        lineNumber: true,
        captionCount: captionCount,
      });
      captionCount += container.querySelectorAll(".ps-algorithm.with-caption").length;
      pre.replaceWith(container);
    } catch (error) {
      console.warn("Unable to render algorithm; keeping its source.", error);
    }
  });
})();
