(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".glass-reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }
  var items = document.querySelectorAll(".glass-reveal:not(.is-scroll-visible)");
  if (!items.length) return;
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  items.forEach(function (el) { io.observe(el); });
})();
