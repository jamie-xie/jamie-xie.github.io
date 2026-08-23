/* ============================================================
   site.js — renders the shared header + sidebar on every page,
   and fills in piece content on piece pages.

   All URLs are built from this script's own location, so the
   site works locally, on a GitHub Pages subpath, or on a
   custom domain without changes.
   ============================================================ */

(function () {
  "use strict";

  var scriptEl = document.querySelector('script[src$="site.js"]');
  var BASE = scriptEl ? scriptEl.src.replace(/site\.js(\?.*)?$/, "") : "/";

  /* Which page are we on? ("about" for the landing page, else a piece slug) */
  function currentSlug() {
    var basePath = new URL(BASE).pathname;
    var p = window.location.pathname;
    if (p.indexOf(basePath) === 0) p = p.slice(basePath.length);
    p = p.replace(/index\.html$/, "").replace(/\/+$/, "");
    return p === "" ? "about" : p;
  }

  /* ---------- header (logo / tagline / icons / dashed rule) ---------- */

  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;

    // TODO: when the personal logo graphic is ready, replace the <a> below
    // with this line (and delete the <a>):
    //   '<img class="logo-img" src="' + BASE + 'assets/logo.png" alt="jamie xie">'
    el.innerHTML =
      '<header class="site-header">' +
        '<a class="logo" href="' + BASE + '">jamie xie</a>' +
        '<span class="tagline">Journalism, Culture, &amp; Media</span>' +
        '<div class="header-icons">' +
          // future small icon goes here, to the LEFT of the bee —
          // just add another <img> line above this one
          '<img class="icon-bee" src="' + BASE + 'assets/bee.png" alt="bee">' +
        "</div>" +
      "</header>" +
      '<div class="rule" aria-hidden="true"></div>';
  }

  /* ---------- sidebar ---------- */

  function renderSidebar(active) {
    var el = document.getElementById("sidebar");
    if (!el) return;

    var html =
      '<a class="nav-link' + (active === "about" ? " active" : "") +
      '" href="' + BASE + '">About</a>';

    // group pieces by year, newest first, preserving order within a year
    var years = [];
    PIECES.forEach(function (piece) {
      if (years.indexOf(piece.year) === -1) years.push(piece.year);
    });
    years.sort(function (a, b) { return b - a; });

    years.forEach(function (year) {
      html += '<div class="year">' + year + "</div>"; // years are labels, not links
      PIECES.forEach(function (piece) {
        if (piece.year !== year) return;
        html +=
          '<a class="nav-link' + (active === piece.slug ? " active" : "") +
          '" href="' + BASE + piece.slug + '/">' + piece.title + "</a>";
      });
    });

    html +=
      '<div class="reading">' + READING.label + "<br>" +
      READING.book + "<br>" + READING.date + "</div>";

    el.innerHTML = html;
  }

  /* ---------- piece page content ---------- */

  function renderPiece(piece) {
    var el = document.getElementById("content");
    if (!el) return;

    document.title = piece.title + " — jamie xie";

    var html =
      '<h1 class="piece-title">' + piece.title + "</h1>" +
      '<p class="piece-meta">' +
        piece.contributors + "<br>" +
        '<a href="' + piece.link.url + '">' + piece.link.text + "</a>, " +
        piece.publication + ", " + piece.date +
      "</p>";

    if (piece.image) {
      html +=
        '<img class="piece-image" src="' + BASE + piece.image + '" alt="">' +
        '<p class="piece-caption">' + piece.caption + "</p>";
    }

    html += "<p>Full text below.</p>";
    html += piece.body.map(function (para) { return "<p>" + para + "</p>"; }).join("");

    el.innerHTML = html;
  }

  /* ---------- boot ---------- */

  var slug = currentSlug();
  renderHeader();
  renderSidebar(slug);

  if (slug !== "about") {
    var piece = PIECES.find(function (p) { return p.slug === slug; });
    if (piece) renderPiece(piece);
  }
})();
