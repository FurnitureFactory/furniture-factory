(function () {
  function cartCount() {
    try {
      return JSON.parse(localStorage.getItem("ff.cart")) || 0;
    } catch (e) {
      return 0;
    }
  }

  function ensureModal() {
    if (document.getElementById("cartEmpty")) return;
    var el = document.createElement("div");
    el.id = "cartEmpty";
    el.className = "cart-empty";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "cartEmptyTitle");
    el.hidden = true;
    el.innerHTML =
      '<div class="cart-empty__scrim" data-cart-empty-close></div>' +
      '<div class="cart-empty__panel editorial-card glass glass--readable">' +
      '<button type="button" class="cart-empty__close" data-cart-empty-close aria-label="Close">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
      "</button>" +
      '<h2 id="cartEmptyTitle">Your cart is empty</h2>' +
      "<p>Nothing here yet. Customise a standing desk and add it to your cart when you&rsquo;re ready.</p>" +
      '<a class="sub-cta" href="/customise">Start customising</a>' +
      "</div>";
    document.body.appendChild(el);

    el.querySelectorAll("[data-cart-empty-close]").forEach(function (node) {
      node.addEventListener("click", closeEmpty);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !el.hidden) closeEmpty();
    });
  }

  function openEmpty() {
    ensureModal();
    var el = document.getElementById("cartEmpty");
    if (!el) return;
    el.hidden = false;
    el.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeEmpty() {
    var el = document.getElementById("cartEmpty");
    if (!el) return;
    el.hidden = true;
    el.classList.remove("show");
    document.body.style.overflow = "";
  }

  function handleCartClick() {
    if (cartCount() > 0) {
      window.location.href = "/customise?checkout=1";
    } else {
      openEmpty();
    }
  }

  function bindCartBtn() {
    var btn = document.getElementById("cartBtn");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", handleCartClick);
  }

  function init() {
    bindCartBtn();
  }

  window.FFCart = { openEmpty: openEmpty, closeEmpty: closeEmpty, count: cartCount };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  document.addEventListener("siteChromeReady", init);
})();
