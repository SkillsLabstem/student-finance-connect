(function () {
  "use strict";

  var state = { data: null };
  var $ = function (id) { return document.getElementById(id); };

  // Escape text before inserting into HTML.
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) { return String(s || "").toLowerCase(); }
  function deptById(id) {
    return state.data.departments.filter(function (d) { return d.id === id; })[0];
  }

  // ---------- Data loading ----------
  function load() {
    fetch("data/catalog.json")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        state.data = data;
        init();
      })
      .catch(function (err) {
        var msg = "Could not load data/catalog.json (" + err.message + "). " +
          "If you opened index.html directly from a folder, run a local server instead, " +
          "for example: python -m http.server, then visit http://localhost:8000.";
        document.querySelector("main").insertAdjacentHTML(
          "afterbegin", '<div class="wrap"><p class="notice">' + esc(msg) + "</p></div>");
      });
  }

  function init() {
    renderStats();
    renderCategories();
    renderForms();
    renderDepartments();
    renderFaculties();
    renderFaq();
    bindEvents();
  }

  // ---------- Rendering ----------
  function renderStats() {
    var d = state.data;
    var items = [
      [d.forms.length, "Forms"],
      [d.departments.length, "Departments"],
      [d.faculties.length, "Faculties & colleges"],
      [d.guidance.length, "Help topics"]
    ];
    $("stats").innerHTML = items.map(function (i) {
      return '<div class="stat"><b>' + i[0] + "</b>" + esc(i[1]) + "</div>";
    }).join("");
  }

  function renderCategories() {
    var cats = [];
    state.data.forms.forEach(function (f) {
      if (cats.indexOf(f.category) === -1) cats.push(f.category);
    });
    cats.sort();
    $("categoryFilter").insertAdjacentHTML("beforeend", cats.map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + "</option>";
    }).join(""));
  }

  function renderForms() {
    var q = norm($("formFilter").value);
    var cat = $("categoryFilter").value;
    var list = state.data.forms.filter(function (f) {
      var dept = deptById(f.submitTo);
      var hay = norm([f.name, f.description, f.category, dept && dept.name].join(" "));
      return (cat === "all" || f.category === cat) && hay.indexOf(q) !== -1;
    });
    $("formsGrid").innerHTML = list.length ? list.map(function (f) {
      var dept = deptById(f.submitTo);
      return '<article class="card">' +
        '<span class="tag">' + esc(f.category) + "</span>" +
        "<h3>" + esc(f.name) + "</h3>" +
        "<p>" + esc(f.description) + "</p>" +
        "<p><strong>Submit to:</strong> " + esc(dept ? dept.name : "To be confirmed") + "</p>" +
        (f.verified ? "" : '<span class="tag warn">Unverified: confirm before use</span>') +
        '<div class="actions"><button class="btn" data-form="' + esc(f.id) + '">View details</button></div>' +
        "</article>";
    }).join("") : '<p class="empty">No forms match your search.</p>';
  }

  function renderDepartments() {
    $("deptGrid").innerHTML = state.data.departments.map(function (d) {
      return '<article class="card"><h3>' + esc(d.name) + "</h3>" +
        "<p>" + esc(d.role) + "</p><dl>" + contactRows(d) + "</dl>" +
        (d.verified ? "" : '<span class="tag warn">Contact details to be confirmed</span>') +
        "</article>";
    }).join("");
  }

  function contactRows(d) {
    var rows = "";
    rows += "<dt>Email</dt><dd>" + (d.email
      ? '<a href="mailto:' + esc(d.email) + '">' + esc(d.email) + "</a>" : "To be confirmed") + "</dd>";
    rows += "<dt>Phone</dt><dd>" + (d.phone
      ? '<a href="tel:' + esc(d.phone.replace(/[^\d+]/g, "")) + '">' + esc(d.phone) + "</a>" : "To be confirmed") + "</dd>";
    rows += "<dt>Location</dt><dd>" + esc(d.location) + "</dd>";
    rows += "<dt>Hours</dt><dd>" + esc(d.hours) + "</dd>";
    return rows;
  }

  function renderFaculties() {
    var q = norm($("facultyFilter").value);
    var list = state.data.faculties.filter(function (f) {
      return norm([f.name, f.abbr, f.type, f.description].join(" ")).indexOf(q) !== -1;
    });
    $("facultyGrid").innerHTML = list.length ? list.map(function (f) {
      return '<article class="card"><span class="tag">' + esc(f.type) + "</span>" +
        "<h3>" + esc(f.name) + " (" + esc(f.abbr) + ")</h3><p>" + esc(f.description) + "</p>" +
        (f.verified ? "" : '<span class="tag warn">Unverified: confirm before use</span>') +
        "</article>";
    }).join("") : '<p class="empty">No faculties match your search.</p>';
  }

  function renderFaq() {
    $("faq").innerHTML = state.data.guidance.map(function (g) {
      return "<details><summary>" + esc(g.q) + "</summary><p>" + esc(g.a) + "</p><ol>" +
        g.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
        (g.verified ? "" : '<span class="tag warn">Unverified guidance: confirm before use</span>') +
        "</details>";
    }).join("");
  }

  // ---------- Modal ----------
  var lastFocus = null;
  function openForm(id) {
    var f = state.data.forms.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    var dept = deptById(f.submitTo);
    var html = '<h3 id="modalTitle">' + esc(f.name) + "</h3>" +
      '<span class="tag">' + esc(f.category) + "</span>" +
      "<p>" + esc(f.description) + "</p>" +
      "<h4>What you need</h4><ul>" +
      f.requirements.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" +
      "<h4>How to submit</h4><p>" + esc(f.method) + "</p>" +
      (f.notes ? "<p><em>" + esc(f.notes) + "</em></p>" : "") +
      (dept ? "<h4>Submit to: " + esc(dept.name) + "</h4><dl>" + contactRows(dept) + "</dl>" : "") +
      '<p class="notice">Verify this information with official UTech, Jamaica sources before submitting.</p>' +
      '<div class="actions" style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn" id="copyBtn">Copy checklist</button>' +
      '<button class="btn ghost" id="printBtn">Print</button></div>' +
      '<p id="copyMsg" aria-live="polite"></p>';
    $("modalBody").innerHTML = html;
    lastFocus = document.activeElement;
    $("modal").hidden = false;
    $("modalClose").focus();

    $("copyBtn").onclick = function () {
      var text = f.name + "\nSubmit to: " + (dept ? dept.name : "TBC") + "\nMethod: " + f.method +
        "\nChecklist:\n" + f.requirements.map(function (r) { return "- " + r; }).join("\n");
      copy(text).then(function () { $("copyMsg").textContent = "Checklist copied."; },
        function () { $("copyMsg").textContent = "Copy failed. Please select the text manually."; });
    };
    $("printBtn").onclick = function () { window.print(); };
  }

  function closeModal() {
    $("modal").hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var t = document.createElement("textarea");
      t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(t);
    });
  }

  // ---------- Global search ----------
  function globalSearch(term) {
    var q = norm(term).trim();
    var box = $("searchResults");
    if (!q) { box.innerHTML = ""; return; }
    var d = state.data, out = [];
    d.forms.forEach(function (f) {
      if (norm([f.name, f.description, f.category].join(" ")).indexOf(q) !== -1)
        out.push({ t: f.name, s: "Form · " + f.category, type: "form", id: f.id });
    });
    d.departments.forEach(function (x) {
      if (norm([x.name, x.role].join(" ")).indexOf(q) !== -1)
        out.push({ t: x.name, s: "Department", type: "section", id: "departments" });
    });
    d.faculties.forEach(function (x) {
      if (norm([x.name, x.abbr, x.description].join(" ")).indexOf(q) !== -1)
        out.push({ t: x.name, s: "Faculty / College", type: "section", id: "faculties" });
    });
    d.guidance.forEach(function (g) {
      if (norm([g.q, g.a, g.steps.join(" ")].join(" ")).indexOf(q) !== -1)
        out.push({ t: g.q, s: "Help", type: "section", id: "help" });
    });
    box.innerHTML = out.length ? out.slice(0, 8).map(function (r) {
      return '<button class="result" data-type="' + r.type + '" data-id="' + esc(r.id) + '">' +
        esc(r.t) + "<small>" + esc(r.s) + "</small></button>";
    }).join("") : '<p class="notice">No results found. Try a different keyword.</p>';
  }

  // ---------- Events ----------
  function bindEvents() {
    $("formFilter").addEventListener("input", renderForms);
    $("categoryFilter").addEventListener("change", renderForms);
    $("facultyFilter").addEventListener("input", renderFaculties);

    $("formsGrid").addEventListener("click", function (e) {
      var b = e.target.closest("[data-form]");
      if (b) openForm(b.getAttribute("data-form"));
    });

    $("globalSearchForm").addEventListener("submit", function (e) {
      e.preventDefault();
      globalSearch($("globalSearch").value);
    });
    $("globalSearch").addEventListener("input", function () { globalSearch(this.value); });

    $("searchResults").addEventListener("click", function (e) {
      var b = e.target.closest(".result");
      if (!b) return;
      if (b.dataset.type === "form") openForm(b.dataset.id);
      else {
        var el = $(b.dataset.id);
        if (el) el.scrollIntoView();
      }
    });

    $("modalClose").addEventListener("click", closeModal);
    $("modal").addEventListener("click", function (e) { if (e.target === $("modal")) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("modal").hidden) closeModal();
    });

    var nav = $("nav");
    $("menuBtn").addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      this.setAttribute("aria-expanded", open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        $("menuBtn").setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---------- Theme ----------
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("themeBtn").textContent = t === "dark" ? "Light" : "Dark";
    try { localStorage.setItem("sfc-theme", t); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem("sfc-theme"); } catch (e) {}
  setTheme(saved || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  $("themeBtn").addEventListener("click", function () {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  load();
})();
