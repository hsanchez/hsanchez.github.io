(function () {
  var storageKey = "site-theme";
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");

  if (!toggle) {
    return;
  }

  function setTheme(theme) {
    var isDark = theme === "dark";
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    toggle.setAttribute("aria-pressed", isDark ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
    toggle.setAttribute(
      "title",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  var savedTheme = null;
  try {
    savedTheme = window.localStorage.getItem(storageKey);
  } catch (error) {
    savedTheme = null;
  }

  setTheme(savedTheme === "dark" ? "dark" : "light");

  toggle.addEventListener("click", function () {
    var nextTheme =
      root.getAttribute("data-theme") === "dark" ? "light" : "dark";

    setTheme(nextTheme);

    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch (error) {
      // Storage can be unavailable in private browsing or strict browser modes.
    }
  });
})();
