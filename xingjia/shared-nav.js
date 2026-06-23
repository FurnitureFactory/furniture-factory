/* Header is static — scroll collapse disabled to avoid banner pulsing. */
(function () {
  var nav = document.getElementById("siteNav");
  if (nav) {
    nav.style.setProperty("--nav-progress", "0");
    nav.classList.remove("is-collapsed");
  }
})();
