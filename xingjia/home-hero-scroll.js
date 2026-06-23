(function () {
  var zone = document.getElementById("heroScrollZone");
  var hero = document.getElementById("heroSplash");
  var intro = document.getElementById("heroIntro");
  if (!zone || !hero || !intro) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var siteBody = document.querySelector(".site-body--wood");
  var contentBlocks = siteBody
    ? siteBody.querySelectorAll(".content-stack > *")
    : [];

  var chrome = hero.querySelectorAll(".hero__scroll");
  var ticking = false;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function easeInOut(t) {
    return t * t * (3 - 2 * t);
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 2.4);
  }

  function fadeRange(p, start, end, ease) {
    if (end <= start) return p >= end ? 1 : 0;
    var t = clamp((p - start) / (end - start), 0, 1);
    return (ease || easeInOut)(t);
  }

  function scrollProgress() {
    var rect = zone.getBoundingClientRect();
    var scrollable = Math.max(zone.offsetHeight - window.innerHeight, 1);
    return clamp(-rect.top / scrollable, 0, 1);
  }

  function update() {
    ticking = false;
    var p = scrollProgress();

    /* phase 1: intro fades · phase 2: content rises */
    var introOut = fadeRange(p, 0, 0.38, easeOut);
    var contentIn = fadeRange(p, 0.42, 0.96, easeOut);

    hero.style.setProperty("--scroll-p", p.toFixed(4));
    hero.style.setProperty("--content-in", contentIn.toFixed(4));

    document.documentElement.style.setProperty("--hero-bg-extra-blur", "0px");

    if (siteBody) {
      siteBody.style.setProperty("--content-in", contentIn.toFixed(4));
      siteBody.classList.toggle("is-entering", contentIn > 0.02 && contentIn < 0.98);
      siteBody.classList.toggle("is-entered", contentIn >= 0.98);
    }

    contentBlocks.forEach(function (el, i) {
      var stagger = clamp(contentIn - i * 0.06, 0, 1);
      el.style.setProperty("--block-in", stagger.toFixed(4));
      if (stagger > 0.12) el.classList.add("is-scroll-visible");
    });

    if (reduced) {
      return;
    }

    var introOpacity = clamp(1 - introOut, 0, 1);
    var lift = introOut * -4;

    hero.style.setProperty("--hero-intro-opacity", introOpacity.toFixed(4));
    intro.style.opacity = String(introOpacity);
    intro.style.transform =
      "translateY(" + lift + "vh) scale(" + (1 - introOut * 0.05) + ")";
    intro.style.pointerEvents = introOpacity < 0.02 ? "none" : "";

    chrome.forEach(function (el) {
      el.style.opacity = String(clamp(1 - fadeRange(p, 0.02, 0.36, easeOut), 0, 1));
    });

    hero.classList.toggle("is-zooming", p > 0.02);
    hero.classList.toggle("is-zoomed", p > 0.92);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  if (reduced) {
    if (siteBody) siteBody.classList.add("is-entered");
    document.querySelectorAll(".glass-reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
