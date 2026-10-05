// Render fenced Mermaid blocks only on pages that opt in.
const blocks = document.querySelectorAll(
  ".content pre code.language-mermaid, .content pre.language-mermaid code, " +
  ".content .language-mermaid pre code",
);

if (blocks.length) {
  try {
    const { default: mermaid } = await import(
      "https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs"
    );
    await document.fonts.ready;

    const diagrams = Array.from(blocks, (code) => ({
      source: code.textContent,
      pre: code.closest("pre"),
      container: document.createElement("div"),
    }));
    let rendering = false;
    let requested = false;
    let currentTheme;
    let renderId = 0;
    const isDark = () => document.body.classList.contains("theme-dark");

    async function renderDiagrams() {
      requested = true;
      if (rendering) return;
      rendering = true;
      try {
        while (requested) {
          requested = false;
          currentTheme = isDark();
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            suppressErrorRendering: true,
            theme: "base",
            themeVariables: {
              darkMode: currentTheme,
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "16px",
              background: currentTheme ? "#181818" : "#fafafa",
              primaryColor: currentTheme ? "#243447" : "#eaf2fa",
              primaryTextColor: currentTheme ? "#f4f4f4" : "#333333",
              primaryBorderColor: currentTheme ? "#7ba2c9" : "#53799e",
              lineColor: currentTheme ? "#b5c4d3" : "#536575",
              secondaryColor: currentTheme ? "#293c35" : "#edf5ef",
              tertiaryColor: currentTheme ? "#38313f" : "#f3eef7",
            },
          });
          for (const diagram of diagrams) {
            try {
              const { svg, bindFunctions } = await mermaid.render(
                `post-mermaid-${++renderId}`,
                diagram.source,
              );
              diagram.container.className = "mermaid-diagram";
              diagram.container.innerHTML = svg;
              if (diagram.pre.isConnected) {
                diagram.pre.replaceWith(diagram.container);
              }
              bindFunctions?.(diagram.container);
            } catch (error) {
              console.warn("Unable to render Mermaid diagram; keeping its source.", error);
            }
          }
        }
      } finally {
        rendering = false;
      }
    }

    // The existing theme toggle changes the body's class, including during rendering.
    new MutationObserver(() => {
      if (isDark() !== currentTheme) renderDiagrams();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    await renderDiagrams();
  } catch (error) {
    console.warn("Unable to load Mermaid; keeping diagram source.", error);
  }
}
