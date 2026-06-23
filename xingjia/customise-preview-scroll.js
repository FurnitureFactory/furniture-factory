(function () {
  if (window.matchMedia("(max-width: 980px)").matches) return;

  var nav = document.getElementById("siteNav");
  var foot = document.querySelector(".site-foot");
  var root = document.documentElement;
  if (!nav) return;

  var GAP = 14;
  var MIN_H = 420;
  var MAX_H = 720;

  function sync() {
    var navH = Math.ceil(nav.getBoundingClientRect().height);
    var footH = foot ? Math.ceil(foot.getBoundingClientRect().height) : 52;
    var vh = window.innerHeight;
    var usable = Math.max(0, vh - navH - footH - GAP * 2);
    var previewH = Math.min(MAX_H, Math.max(MIN_H, usable));
    if (usable < MIN_H) previewH = Math.max(240, usable);
    var centerOffset = Math.max(0, (usable - previewH) / 2);
    var stickyTop = navH + GAP + centerOffset;

    root.style.setProperty("--site-foot-h", footH + "px");
    root.style.setProperty("--preview-gap", GAP + "px");
    root.style.setProperty("--preview-height", previewH + "px");
    root.style.setProperty("--preview-sticky-top", stickyTop + "px");
  }

  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  if (typeof ResizeObserver !== "undefined") {
    var ro = new ResizeObserver(sync);
    ro.observe(nav);
    if (foot) ro.observe(foot);
  }
  sync();
})();
