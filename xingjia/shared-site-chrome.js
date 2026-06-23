(function () {
  var PAGES = {
    home: { href: "/", label: "Home" },
    customise: { href: "/customise", label: "Customise" },
    corporate: { href: "/corporate", label: "Corporate" },
    consultant: { href: "/consultant", label: "Consultant" },
    faq: { href: "/faq", label: "FAQ" },
    story: { href: "/our-story", label: "Our story", short: "Story" },
    certs: { href: "/certifications", label: "Certification & features", short: "Certs" },
  };

  function navLabels(p) {
    if (!p.short || p.short === p.label) return p.label;
    return (
      '<span class="nav__long">' +
      p.label +
      '</span><span class="nav__short">' +
      p.short +
      "</span>"
    );
  }

  function deskIcon() {
    return (
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
      '<rect x="3" y="8" width="18" height="2.5" rx="0.5" fill="currentColor" stroke="none"/>' +
      '<path d="M6 10.5v9M18 10.5v9"/></svg>'
    );
  }

  function navLink(key, active) {
    var p = PAGES[key];
    if (!p) return "";
    return (
      '<a href="' +
      p.href +
      '"' +
      (active === key ? ' class="active" aria-current="page"' : "") +
      ">" +
      navLabels(p) +
      "</a>"
    );
  }

  function buildNav(active) {
    var keys = ["customise", "corporate", "consultant", "faq", "story", "certs"];
    return (
      '<a class="brand" href="/">' +
      '<span class="brand__mark" aria-hidden="true">' +
      deskIcon() +
      "</span>" +
      '<span class="brand__text">Furniture Factory</span></a>' +
      '<nav class="nav" aria-label="Primary">' +
      keys.map(function (key) {
        return navLink(key, active);
      }).join("") +
      "</nav>" +
      '<div class="tools">' +
      '<button type="button" class="iconbtn" id="cartBtn" aria-label="Cart">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/>' +
      '<path d="M2 3h3l2.4 12.4a1.6 1.6 0 0 0 1.6 1.3h8.2a1.6 1.6 0 0 0 1.6-1.3L22 7H6"/></svg>' +
      '<span class="cartcount" id="cartCount" hidden>0</span></button></div>'
    );
  }

  function buildFoot() {
    return (
      '<div class="foot__inner">' +
      '<div class="foot__left">' +
      '<a class="brand" href="/">Furniture Factory</a>' +
      '<span class="foot__c">Factory direct · Singapore</span>' +
      "</div>" +
      '<span class="foot__year">© 2026</span>' +
      "</div>"
    );
  }

  function initDropdown() {
    document.querySelectorAll("[data-nav-drop]").forEach(function (drop) {
      var btn = drop.querySelector(".nav__drop-btn");
      if (!btn) return;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = drop.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    document.addEventListener("click", function () {
      document.querySelectorAll("[data-nav-drop].is-open").forEach(function (drop) {
        drop.classList.remove("is-open");
        var btn = drop.querySelector(".nav__drop-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initForms() {
    document.querySelectorAll("[data-contact-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var subject = form.getAttribute("data-subject") || "Furniture Factory enquiry";
        var lines = [];
        fd.forEach(function (v, k) {
          if (v) lines.push(k + ": " + v);
        });
        var body = lines.join("\n");
        window.location.href =
          "mailto:tables.furniturefactory.sg@gmail.com?subject=" +
          encodeURIComponent(subject) +
          "&body=" +
          encodeURIComponent(body);
      });
    });
  }

  function initFaq() {
    document.querySelectorAll(".faq__q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq__item");
        var open = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  function init() {
    var active = document.body.getAttribute("data-page") || "";
    var nav = document.getElementById("siteNav");
    if (nav && nav.hasAttribute("data-chrome-nav")) {
      nav.innerHTML = buildNav(active);
      nav.dataset.built = "1";
    }
    var foot = document.querySelector(".site-foot[data-chrome-foot]");
    if (foot) {
      foot.innerHTML = buildFoot();
    }
    initDropdown();
    initForms();
    initFaq();
    var n = 0;
    try {
      n = JSON.parse(localStorage.getItem("ff.cart")) || 0;
    } catch (e) {}
    var cart = document.getElementById("cartCount");
    if (cart && n > 0) {
      cart.textContent = n;
      cart.hidden = false;
    }
    document.dispatchEvent(new CustomEvent("siteChromeReady"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
