const $ = (s, el = document) => el.querySelector(s);
const pad = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// 有尺寸的本機照片加上 srcset 與寬高，避免載入時版面跳動
const imgAttrs = (ph, sizes) =>
  [
    `src="${ph.m}"`,
    ph.s !== ph.m ? `srcset="${ph.s} 800w, ${ph.m} 1600w" sizes="${sizes}"` : "",
    ph.w ? `width="${ph.w}" height="${ph.h}"` : "",
  ].join(" ");
const bg = (ph) => (ph.color ? `style="background:${ph.color}"` : "");

// 捲動後 header 加底色
function initHeader() {
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// 元素進入畫面時淡入
function revealOnScroll(selector) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(selector).forEach((el) => io.observe(el));
}

/* ---------- 首頁 ---------- */
function initHome() {
  initHeader();

  // 主視覺輪播
  const hero = $("#hero");
  const dots = $("#heroDots");
  const caption = $("#heroCaption");
  const slides = HERO.map((h) => {
    const s = document.createElement("div");
    s.className = "hero-slide";
    s.style.backgroundImage = `url("${h.l}")`;
    if (h.color) s.style.backgroundColor = h.color;
    hero.prepend(s);
    const d = document.createElement("button");
    d.setAttribute("aria-label", h.caption);
    dots.append(d);
    return s;
  }).reverse();
  [...dots.children].forEach((d, i) => (d.onclick = () => show(i, true)));
  let current = -1, timer;
  function show(i, manual) {
    slides.forEach((s, j) => s.classList.toggle("active", j === i));
    [...dots.children].forEach((d, j) => d.classList.toggle("active", j === i));
    caption.textContent = HERO[i].caption;
    current = i;
    if (manual) { clearInterval(timer); timer = setInterval(next, 7000); }
  }
  const next = () => show((current + 1) % HERO.length);
  if (HERO.length) { show(0); timer = setInterval(next, 7000); }

  // 篩選按鈕
  const filters = $("#filters");
  const counts = { all: PROJECTS.length };
  PROJECTS.forEach((p) => (counts[p.cat] = (counts[p.cat] || 0) + 1));
  const options = [["all", "全部"], ...Object.entries(CATEGORIES)];
  filters.innerHTML = options
    .map(([k, v]) => `<button data-cat="${k}" class="${k === "all" ? "active" : ""}">${v}<span class="count">${counts[k] || 0}</span></button>`)
    .join("");

  // 作品網格：每 5 件中第 1 件放大，形成不規則節奏
  const grid = $("#worksGrid");
  grid.innerHTML = PROJECTS.map((p, i) => `
    <a class="work ${i % 5 === 0 ? "wide" : ""}" data-cat="${p.cat}" href="project.html?id=${encodeURIComponent(p.id)}">
      <div class="work-media" ${bg(p.cover)}><img ${imgAttrs(p.cover, "(max-width: 600px) 100vw, (max-width: 960px) 50vw, 66vw")} alt="${esc(p.title)}" loading="lazy"></div>
      <div class="work-info">
        <div><h3 class="work-title">${esc(p.title)}</h3><span class="work-en">${esc(p.en)}</span></div>
        <span class="work-meta">${p.photos.length ? `${p.photos.length} 張 · ` : ""}${CATEGORIES[p.cat] || ""} · ${p.year}</span>
      </div>
    </a>`).join("");

  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const cat = btn.dataset.cat;
    filters.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    let shown = 0;
    grid.querySelectorAll(".work").forEach((w) => {
      const match = cat === "all" || w.dataset.cat === cat;
      w.classList.toggle("hidden", !match);
      // 篩選後重新安排放大的位置
      w.classList.toggle("wide", match && shown % 5 === 0);
      if (match) shown++;
    });
  });

  revealOnScroll(".work");
}

/* ---------- 專案頁 ---------- */
function initProject() {
  initHeader();
  const id = new URLSearchParams(location.search).get("id");
  const idx = Math.max(0, PROJECTS.findIndex((p) => p.id === id));
  const p = PROJECTS[idx];
  if (!p) return location.replace("index.html");
  const next = PROJECTS[(idx + 1) % PROJECTS.length];
  const photos = p.photos;
  const lead = p.cover;
  const camera = photos.map((ph) => ph.exif && ph.exif.camera).find(Boolean);
  document.title = `${p.title} · Jeff Chen Photography`;

  const facts = [
    ["Date", p.date || p.year],
    p.place && ["Location", p.place],
    p.model && ["Model", p.model],
    ["Category", CATEGORIES[p.cat]],
    camera && ["Camera", camera],
    p.tools && ["Post", p.tools],
    ["Frames", photos.length ? `${photos.length} 張` : "—"],
  ].filter(Boolean);

  $("#project").innerHTML = `
    <section class="p-hero">
      <div class="p-hero-text">
        <a class="back" href="index.html#works">← All works</a>
        <div class="p-index">${pad(idx + 1)} / ${pad(PROJECTS.length)}</div>
        <h1 class="p-title">${esc(p.title)}</h1>
        <p class="p-en">${esc(p.en)}</p>
        ${p.intro ? `<p class="p-intro">${esc(p.intro)}</p>` : ""}
        <dl class="p-facts">${facts.map(([k, v]) => `<div><dt class="label">${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      </div>
      <div class="p-hero-media" ${bg(lead)}><img src="${lead.l}" alt="${esc(p.title)}"></div>
    </section>

    <section class="gallery">${photos.map((ph, i) => `<figure data-i="${i}" ${bg(ph)}><img ${imgAttrs(ph, "(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw")} alt="${esc(p.title)} ${i + 1}" loading="lazy"></figure>`).join("")}</section>

    ${next === p ? "" : `<a class="p-next" href="project.html?id=${encodeURIComponent(next.id)}">
      <img src="${next.cover.m}" alt="${esc(next.title)}" loading="lazy">
      <div class="p-next-text">
        <span class="label">Next series</span>
        <h2 class="p-title">${esc(next.title)}</h2>
        <p class="p-en">${esc(next.en)}</p>
      </div>
    </a>`}`;

  revealOnScroll(".gallery figure");
  initLightbox(photos);
}

function initLightbox(photos) {
  const lb = $("#lightbox"), img = $("#lbImg"), count = $("#lbCount"), exif = $("#lbExif");
  let i = 0;
  const show = (n) => {
    i = (n + photos.length) % photos.length;
    const ph = photos[i];
    img.style.opacity = 0;
    img.onload = () => (img.style.opacity = 1);
    img.src = ph.l;
    count.textContent = `${pad(i + 1)} / ${pad(photos.length)}`;
    const e = ph.exif || {};
    exif.textContent = [e.camera, e.lens, e.focal, e.aperture, e.shutter, e.iso].filter(Boolean).join("　·　");
  };
  const open = (n) => { show(n); lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; };
  const close = () => { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; };

  $(".gallery").addEventListener("click", (e) => {
    const fig = e.target.closest("figure");
    if (fig) open(+fig.dataset.i);
  });
  $("#lbPrev").onclick = () => show(i - 1);
  $("#lbNext").onclick = () => show(i + 1);
  $("#lbClose").onclick = close;
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  });

  // 手機左右滑動
  let x0 = null;
  lb.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  });
}
