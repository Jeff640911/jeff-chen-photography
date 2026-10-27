// 讀取原始照片資料夾，產生網站用的縮圖與 photos.js
//
// 用法：npm run photos -- <原始照片資料夾>
//   路徑會記在 projects.json，之後直接 npm run photos 即可；第一次沒帶路徑時讀取 ./photos
//
// 資料夾結構：每個子資料夾是一個系列
//   原始照片/
//     01-成田山-阿璃/  *.jpg *.png *.tif …
//     02-擱淺的船/
//
// 系列的標題、分類、介紹等寫在 projects.json；新的資料夾會自動加入一筆預設值。
// 原始照片資料夾不會被修改。

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import exifr from "exifr";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "images");
const META = path.join(ROOT, "projects.json");
const DATA = path.join(ROOT, "photos.js");

// 三種尺寸：網格縮圖、相簿、燈箱與主視覺
const SIZES = { s: 800, m: 1600, l: 2560 };
const QUALITY = 82;
const EXTS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".avif"]);
const CATS = ["portrait", "landscape", "concept"];

const exists = (p) => fs.stat(p).then((s) => s, () => null);
const naturalSort = (a, b) => a.localeCompare(b, "zh-Hant", { numeric: true });

// 資料夾名稱 → 網址用代號，例如「01-成田山 阿璃」→「01-成田山-阿璃」
const slugify = (name) =>
  name.normalize("NFC").trim().replace(/[\s_/\\?#%&]+/g, "-").replace(/-+/g, "-").toLowerCase();

// 去掉排序用的數字前綴當預設標題
const titleFrom = (name) => name.replace(/^\d+[\s._-]*/, "").replace(/[-_]+/g, " ").trim() || name;

function fmtShutter(t) {
  if (!t) return null;
  return t >= 1 ? `${t}s` : `1/${Math.round(1 / t)}s`;
}

function fmtExif(e) {
  if (!e) return null;
  const camera = [e.Make, e.Model].filter(Boolean).join(" ").replace(/^(\S+) \1/i, "$1").trim();
  const out = {
    camera: camera || null,
    lens: e.LensModel || null,
    focal: e.FocalLength ? `${Math.round(e.FocalLength)}mm` : null,
    aperture: e.FNumber ? `f/${+e.FNumber.toFixed(1)}` : null,
    shutter: fmtShutter(e.ExposureTime),
    iso: e.ISO ? `ISO ${e.ISO}` : null,
    date: e.DateTimeOriginal instanceof Date ? e.DateTimeOriginal.toISOString().slice(0, 10) : null,
  };
  return Object.values(out).some(Boolean) ? out : null;
}

async function processPhoto(file, outDir, slug) {
  const base = path.parse(file).name.replace(/[^\p{L}\p{N}_-]+/gu, "-");
  const src = await fs.stat(file);
  const img = sharp(file, { failOn: "none" }).rotate(); // 依 EXIF 方向轉正
  const meta = await img.metadata();
  const swap = meta.orientation >= 5;
  const w0 = swap ? meta.height : meta.width;
  const h0 = swap ? meta.width : meta.height;

  const urls = {};
  for (const [key, max] of Object.entries(SIZES)) {
    const name = `${base}-${key}.webp`;
    const dest = path.join(outDir, name);
    urls[key] = `images/${encodeURIComponent(slug)}/${encodeURIComponent(name)}`;
    const done = await exists(dest);
    if (done && done.mtimeMs >= src.mtimeMs) continue; // 已產生且原圖沒變就跳過
    await img
      .clone()
      .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(dest);
  }

  // 圖片載入前顯示的主色
  const { dominant } = await sharp(file).resize(32, 32, { fit: "inside" }).stats();
  const color = `rgb(${dominant.r},${dominant.g},${dominant.b})`;
  const exif = fmtExif(await exifr.parse(file).catch(() => null));

  return { file: path.basename(file), ...urls, w: w0, h: h0, color, exif };
}

async function main() {
  const meta = (await exists(META)) ? JSON.parse(await fs.readFile(META, "utf8")) : {};
  const SRC = path.resolve(ROOT, process.argv[2] || meta.source || "photos");
  if (!(await exists(SRC))) {
    console.error(`找不到原始照片資料夾：${SRC}`);
    process.exit(1);
  }
  // 在專案資料夾內就存相對路徑，換電腦或 clone 下來也能用
  const rel = path.relative(ROOT, SRC);
  meta.source = rel && !rel.startsWith("..") && !path.isAbsolute(rel) ? rel : SRC;
  meta.hero ||= [];
  meta.projects ||= {};

  const dirs = (await fs.readdir(SRC, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort(naturalSort);

  const projects = [];
  const usedSlugs = new Set();

  for (const dir of dirs) {
    const files = (await fs.readdir(path.join(SRC, dir)))
      .filter((f) => !f.startsWith(".") && EXTS.has(path.extname(f).toLowerCase()))
      .sort(naturalSort);
    if (!files.length) continue;

    // 新資料夾：在 projects.json 加入預設值，之後手動補資料
    const info = (meta.projects[dir] ||= {
      title: titleFrom(dir),
      en: "",
      category: "portrait",
      year: new Date().getFullYear(),
      place: "",
      intro: "",
      cover: files[0],
      hidden: false,
    });
    if (info.hidden) continue;
    if (!CATS.includes(info.category)) console.warn(`⚠ ${dir}：category 應為 ${CATS.join(" / ")}`);

    const slug = info.slug || slugify(dir);
    if (usedSlugs.has(slug)) throw new Error(`代號重複：${slug}（請在 projects.json 設定不同的 slug）`);
    usedSlugs.add(slug);

    const outDir = path.join(OUT, slug);
    await fs.mkdir(outDir, { recursive: true });

    process.stdout.write(`▸ ${dir}（${files.length} 張）`);
    const photos = [];
    for (const f of files) {
      try {
        photos.push(await processPhoto(path.join(SRC, dir, f), outDir, slug));
        process.stdout.write(".");
      } catch (err) {
        console.warn(`\n  ⚠ 略過 ${f}：${err.message}`);
      }
    }
    console.log(" 完成");

    // 刪掉原圖已經不存在的舊縮圖
    const keep = new Set(photos.flatMap((p) => ["s", "m", "l"].map((k) => decodeURIComponent(path.basename(p[k])))));
    for (const f of await fs.readdir(outDir)) if (!keep.has(f)) await fs.rm(path.join(outDir, f));

    const cover = photos.find((p) => p.file === info.cover) || photos[0];
    projects.push({
      id: slug,
      title: info.title,
      en: info.en || "",
      cat: info.category,
      year: info.year,
      date: info.date || "",
      place: info.place || "",
      model: info.model || "",
      tools: info.tools || "",
      intro: info.intro || "",
      behance: info.behance || "",
      cover,
      photos,
      _dir: dir,
    });
  }

  // 刪掉已經不存在或改了代號的系列縮圖
  for (const d of await fs.readdir(OUT).catch(() => [])) {
    if (!d.startsWith(".") && !usedSlugs.has(d)) await fs.rm(path.join(OUT, d), { recursive: true });
  }

  // 首頁主視覺：projects.json 的 hero 寫 "資料夾/檔名"；沒寫就用前三個系列的封面
  const find = (ref) => {
    const [dir, file] = ref.split("/");
    const p = projects.find((x) => x._dir === dir);
    const photo = p && p.photos.find((x) => x.file === file);
    return photo && { ...photo, caption: `${p.title} · ${p.place ? p.place + " " : ""}${p.year}` };
  };
  let hero = meta.hero.map(find).filter(Boolean);
  if (!hero.length) hero = projects.slice(0, 3).map((p) => find(`${p._dir}/${p.cover.file}`));
  if (!meta.hero.length) meta.hero = projects.slice(0, 3).map((p) => `${p._dir}/${p.cover.file}`);

  projects.forEach((p) => delete p._dir);
  await fs.writeFile(META, JSON.stringify(meta, null, 2) + "\n");
  await fs.writeFile(
    DATA,
    `// 由 scripts/build-photos.mjs 自動產生，請勿手動修改；要改內容請編輯 projects.json 後重跑\n` +
      `window.LOCAL_PROJECTS = ${JSON.stringify(projects, null, 1)};\n` +
      `window.LOCAL_HERO = ${JSON.stringify(hero, null, 1)};\n`
  );

  const total = projects.reduce((n, p) => n + p.photos.length, 0);
  console.log(`\n✓ ${projects.length} 個系列、${total} 張照片 → images/、photos.js`);
  console.log(`  系列資料請到 projects.json 補上標題、分類、介紹，再執行一次 npm run photos`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
