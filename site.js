(function () {
  "use strict";

  function savedContent() {
    try { return JSON.parse(localStorage.getItem("cv-site-content-v3")) || window.siteContent; } catch { return window.siteContent; }
  }
  const EDIT_MODE = document.body.classList.contains("editing");
  let activeContent;
  function editable(value, path) { const safe = escapeHtml(value || ""); return EDIT_MODE ? `<span contenteditable="true" data-edit-path="${path}">${safe}</span>` : safe; }

  function renderProfile(content) {
    const profile = content.profile || {};
    const links = (profile.links || []).map((link, i) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${editable(link.label, `profile.links.${i}.label`)}</a>`).join('<span aria-hidden="true">/</span>');
    document.getElementById("profile-root").innerHTML = `<section class="intro" id="top"><div class="intro-copy"><p class="eyebrow">${editable(profile.eyebrow, "profile.eyebrow")}</p><h1>${editable(profile.name, "profile.name")}</h1><p class="affiliation">${editable(profile.affiliation, "profile.affiliation")}</p>${(profile.bio || []).map((p, i) => `<p>${editable(p, `profile.bio.${i}`)}</p>`).join("")}<nav class="profile-links">${links}</nav></div><aside class="portrait-card">${profile.photo ? `<img class="portrait-image" src="${escapeHtml(profile.photo)}" alt="Portrait of ${escapeHtml(profile.name || "")}" width="230" height="280">` : ""}</aside></section>`;
  }

  function renderSection(section, path) {
    const heading = `<h2>${editable(section.title || "Untitled section", `${path}.title`)}</h2>`;
    const controls = EDIT_MODE ? `<div class="section-editor-controls"><button data-add-entry="${path}">＋ 添加条目</button><button data-delete-section="${path}">删除本栏目</button></div>` : "";
    const cards = `<div class="interest-grid">${(section.items || []).map((item, i) => `<article><span class="interest-index">${String(i + 1).padStart(2, "0")}</span><h3>${editable(item.title, `${path}.items.${i}.title`)}</h3><p>${editable(item.text, `${path}.items.${i}.text`)}</p></article>`).join("")}</div>`;
    if (section.type === "research") return `<section class="section">${heading}${(section.body || []).map((p, i) => `<p>${editable(p, `${path}.body.${i}`)}</p>`).join("")}${cards}${controls}</section>`;
    if (section.type === "cards") return `<section class="section">${heading}${cards}${controls}</section>`;
    if (section.type === "news") return `<section class="section"><div class="section-heading-row">${heading}<span class="section-note">${editable(section.note || "", `${path}.note`)}</span></div><ul class="news-list">${(section.items || []).map((item, i) => `<li><time>${editable(item.date, `${path}.items.${i}.date`)}</time><span class="news-tag ${escapeHtml((item.tag || "").toLowerCase())}">${editable(item.tag, `${path}.items.${i}.tag`)}</span><span>${editable(item.text, `${path}.items.${i}.text`)}</span></li>`).join("")}</ul>${controls}</section>`;
    if (section.type === "timeline") return `<section class="section">${heading}<ul class="activity-list">${(section.items || []).map((item, i) => `<li><time>${editable(item.date, `${path}.items.${i}.date`)}</time><div><strong>${editable(item.title, `${path}.items.${i}.title`)}</strong>${item.text ? `<br>${editable(item.text, `${path}.items.${i}.text`)}` : ""}</div></li>`).join("")}</ul>${controls}</section>`;
    return `<section class="section">${heading}${(section.body || []).map((p, i) => `<p>${editable(p, `${path}.body.${i}`)}</p>`).join("")}${controls}</section>`;
  }

  function renderContent() {
    const content = activeContent = savedContent() || {};
    renderProfile(content);
    document.getElementById("before-publications").innerHTML = (content.beforePublications || []).map((section, index) => renderSection(section, `beforePublications.${index}`)).join("");
    document.getElementById("after-publications").innerHTML = (content.afterPublications || []).map((section, index) => renderSection(section, `afterPublications.${index}`)).join("");
    document.getElementById("site-footer").innerHTML = `<p>${escapeHtml(content.footer || "") } · <a href="#top">Back to top</a></p>`;
    if (content.profile && content.profile.name) document.title = content.profile.name;
  }

  const SELF = "Zixuan Shen";
  const list = document.getElementById("publication-list");
  const counter = document.getElementById("publication-count");
  const buttons = Array.from(document.querySelectorAll(".filter-button"));
  const publications = Array.isArray(window.publications) ? window.publications.slice() : [];

  publications.sort((a, b) => (b.year - a.year) || ((b.month || 0) - (a.month || 0)) || a.title.localeCompare(b.title));

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  renderContent();

  if (EDIT_MODE) {
    const history = [];
    const undoButton = document.getElementById("undo-content");
    const updateUndoButton = () => { if (undoButton) undoButton.disabled = history.length === 0; };
    const remember = () => { history.push(JSON.stringify(activeContent)); if (history.length > 50) history.shift(); updateUndoButton(); };
    const setPath = (path, value) => { const keys = path.split("."); const finalKey = keys.pop(); const target = keys.reduce((obj, key) => obj[key], activeContent); target[finalKey] = value; };
    const persist = () => { localStorage.setItem("cv-site-content-v3", JSON.stringify(activeContent)); const status = document.getElementById("save-status"); if (status) status.textContent = "已保存到本机"; };
    document.addEventListener("focusin", (event) => { if (event.target.closest("[data-edit-path]")) remember(); });
    document.addEventListener("input", (event) => { const node = event.target.closest("[data-edit-path]"); if (!node) return; setPath(node.dataset.editPath, node.textContent.trim()); persist(); });
    document.addEventListener("click", (event) => {
      const add = event.target.closest("[data-add-entry]"); const remove = event.target.closest("[data-delete-section]"); const newSection = event.target.closest("[data-new-section]");
      if (add) { remember(); const section = add.dataset.addEntry.split(".").reduce((obj, key) => obj[key], activeContent); section.items = section.items || []; section.items.push(section.type === "news" ? { date: "2026", tag: "News", text: "New update" } : { date: "2026", title: "New entry", text: "Add details here." }); persist(); renderContent(); }
      if (remove) { remember(); const keys = remove.dataset.deleteSection.split("."); const index = Number(keys.pop()); keys.reduce((obj, key) => obj[key], activeContent).splice(index, 1); persist(); renderContent(); }
      if (newSection) { remember(); activeContent[newSection.dataset.newSection].push({ type: "text", title: "New Section", body: ["Click here to edit this text."] }); persist(); renderContent(); }
    });
    undoButton?.addEventListener("click", () => { if (!history.length) return; activeContent = JSON.parse(history.pop()); persist(); renderContent(); updateUndoButton(); });
    document.getElementById("export-content")?.addEventListener("click", () => { const source = `window.siteContent = ${JSON.stringify(activeContent, null, 2)};\n`; const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" })); const link = document.createElement("a"); link.href = url; link.download = "site-content.js"; link.click(); URL.revokeObjectURL(url); });
    document.getElementById("publish-content")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = "正在发布…";
      try {
        const response = await fetch("/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(activeContent) });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.output || "Publication failed");
        document.getElementById("save-status").textContent = "已发布，页面将在约 1–2 分钟后更新";
        alert("发布成功。GitHub Pages 正在更新。\n\n" + result.output);
      } catch (error) {
        alert("发布失败：\n" + error.message);
      } finally {
        button.disabled = false;
        button.textContent = "一键发布";
      }
    });
  }

  function renderAuthors(authors) {
    return authors.map((author) => {
      const safe = escapeHtml(author);
      return author === SELF ? `<span class="self-author">${safe}</span>` : safe;
    }).join(", ");
  }

  function paperUrl(paper) {
    if (paper.url) return paper.url;
    if (paper.doi) return `https://doi.org/${paper.doi}`;
    if (paper.localPdf) return paper.localPdf;
    return "#";
  }

  function paperLinks(paper) {
    const links = [];
    if (paper.doi) links.push(`<a href="https://doi.org/${escapeHtml(paper.doi)}" target="_blank" rel="noreferrer">DOI</a>`);
    if (paper.arxiv) links.push(`<a href="https://arxiv.org/abs/${escapeHtml(paper.arxiv)}" target="_blank" rel="noreferrer">arXiv</a>`);
    if (paper.localPdf) links.push(`<a href="${escapeHtml(paper.localPdf)}">PDF</a>`);
    return links.join("");
  }

  function render(filter) {
    const filtered = publications.filter((paper) => {
      if (filter === "all") return true;
      if (filter === "first-author") return paper.authors[0] === SELF;
      return paper.type === filter;
    });

    let currentYear = null;
    const chunks = [];

    filtered.forEach((paper) => {
      if (paper.year !== currentYear) {
        currentYear = paper.year;
        chunks.push(`<h3 class="year-heading">${paper.year}</h3>`);
      }

      chunks.push(`
        <article class="publication-card">
          <div class="paper-thumb${paper.image ? " has-image" : ""}" aria-hidden="true">
            ${paper.image ? `<img src="${escapeHtml(paper.image)}" alt="" loading="lazy">` : ""}
            <span class="thumb-year">${paper.year}</span>
            <span class="thumb-venue">${escapeHtml(paper.shortVenue || "Publication")}</span>
          </div>
          <div>
            <a class="publication-title" href="${escapeHtml(paperUrl(paper))}" target="_blank" rel="noreferrer">${escapeHtml(paper.title)}</a>
            <p class="authors">${renderAuthors(paper.authors)}</p>
            <p class="venue-line">${escapeHtml(paper.venue)}</p>
            ${paper.award ? `<p class="paper-award">${escapeHtml(paper.award)}</p>` : ""}
            ${paper.summary ? `<p class="paper-summary">${escapeHtml(paper.summary)}</p>` : ""}
            <div class="paper-links">${paperLinks(paper)}</div>
          </div>
        </article>`);
    });

    list.innerHTML = chunks.join("");
    counter.textContent = `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      render(button.dataset.filter || "all");
    });
  });

  render("all");
})();
