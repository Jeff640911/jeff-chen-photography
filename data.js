// 網站資料：執行過 npm run photos 後改用 photos.js 的本機照片，否則顯示 Behance 示意圖
const CATEGORIES = { portrait: "人像", landscape: "風景", concept: "概念創作" };

const CDN = "https://mir-s3-cdn-cf.behance.net";
const bh = (file) => ({
  s: `${CDN}/project_modules/1400_webp/${file}`,
  m: `${CDN}/project_modules/1400_webp/${file}`,
  l: `${CDN}/project_modules/max_3840_webp/${file}`,
});
const bhCover = (file) => ({ s: `${CDN}/projects/max_808/${file}`, m: `${CDN}/projects/max_808/${file}`, l: `${CDN}/projects/max_808/${file}` });

const SAMPLE_PROJECTS = [
  { id: "241399313", title: "2025 FUJIFILM GFX100SII 人像特輯", en: "GFX Portraits", cat: "portrait", year: 2025, place: "台灣", cover: "ccec88241399313.Y3JvcCw5NDYsNzQwLDIyNyww.jpg" },
  { id: "241365209", title: "2025 人像攝影 A1 篇", en: "Portraits on A1", cat: "portrait", year: 2025, place: "台灣", cover: "0885f9241365209.Y3JvcCw4NjM0LDY3NTMsMCw0MDY.jpg" },
  { id: "215377025", title: "風的形體", en: "The Shape of Wind", cat: "concept", year: 2024, place: "台灣", cover: "3d7630215377025.Y3JvcCwyNjExLDIwNDMsMjI2LDA.jpg" },
  { id: "214571499", title: "紅顏袖香", en: "Kimono · Tainan", cat: "portrait", year: 2024, place: "台南", cover: "8e4649214571499.Y3JvcCwxNTQwLDEyMDQsMCw1NTI.png" },
  {
    id: "212482479", title: "楓半紅，杏略黃", en: "Naritasan Shinshoji", cat: "portrait", year: 2024, place: "成田山新勝寺 · 千葉",
    cover: "53e4bd212482479.Y3JvcCwxMTE2OCw4NzM2LDI0OCww.jpg",
    date: "2024.11.06", model: "阿璃", tools: "Photoshop",
    intro: "十一月初的成田山，楓葉才紅了一半，銀杏剛開始轉黃。在新勝寺的石階與迴廊之間，跟著午後斜射的光，記錄阿璃在季節交界的模樣。",
    gallery: [
      "facafa212482479.6735ab8e441ec.jpg", "2d3b86212482479.6735ab8e42c26.jpg", "3d77eb212482479.6735ab8e406c8.jpg",
      "181346212482479.6735ab8e40ece.jpg", "ad908b212482479.6735ab8e439e9.jpg", "6bafd3212482479.6735ab8e416b1.jpg",
      "738f23212482479.6735ab8e424e4.jpg", "9eb956212482479.6735ab8e44f7e.jpg", "2efa84212482479.6735ab8e3feee.jpg",
      "dc14f4212482479.6735ab8e3f75d.jpg", "2a3415212482479.6735ab8e448c1.jpg", "85b9ba212482479.6735ab8e432ac.jpg",
      "f37277212482479.6735ab8e41dac.jpg",
    ],
  },
  { id: "205743169", title: "夕陽", en: "Sunset", cat: "landscape", year: 2024, place: "屏東", cover: "51f6e9205743169.Y3JvcCwyNjI0LDIwNTMsMjI3LDA.jpg" },
  { id: "205412459", title: "高雄海港夕陽", en: "Kaohsiung Harbour", cat: "landscape", year: 2024, place: "高雄", cover: "24a2b8205412459.Y3JvcCwyNjI3LDIwNTUsMjI3LDA.jpg" },
  { id: "205364247", title: "擱淺，枋山海岸旁的 IRIANA", en: "IRIANA, Fangshan", cat: "landscape", year: 2024, place: "枋山", cover: "b5445d205364247.Y3JvcCwyNjIwLDIwNTAsMjI3LDA.jpg" },
  { id: "204636709", title: "沙丘廢土", en: "Dune Wasteland", cat: "concept", year: 2024, place: "屏東", cover: "caa438204636709.66ac2a3293643.jpg" },
  { id: "204636545", title: "擱淺的船", en: "The Stranded Ship", cat: "landscape", year: 2024, place: "屏東", cover: "ee2abb204636545.66ac28db12b0b.jpg" },
  { id: "199554439", title: "HAN HAN · 沖繩之旅", en: "Okinawa Travel", cat: "portrait", year: 2024, place: "沖繩", cover: "7d3e01199554439.Y3JvcCwzNTAzLDI3MzksMCwxMTAx.jpg" },
  { id: "197815279", title: "HAN HAN · Taiwan Beauty", en: "Taiwan Beauty", cat: "portrait", year: 2024, place: "台灣", cover: "c08ebb197815279.Y3JvcCw5MzE3LDcyODcsMCwyOTUx.jpg" },
].map(({ cover, gallery, ...p }) => ({
  ...p,
  cover: bhCover(cover),
  photos: gallery ? gallery.map(bh) : [],
  behance: `https://www.behance.net/gallery/${p.id}/_`,
}));

const SAMPLE_HERO = [
  { ...bh("48e1ee204636545.66ac28dbbb84f.jpg"), caption: "擱淺的船 · 屏東 2024" },
  { ...bh("a345cb241399313.69573a43a49cc.jpg"), caption: "GFX100SII 人像 · 2025" },
  { ...bh("3d77eb212482479.6735ab8e406c8.jpg"), caption: "成田山新勝寺 · 2024" },
];

// 還沒匯入的系列先用 Behance 示意圖補上；全部匯入後改成 false
const SHOW_SAMPLES = true;

const LOCAL = Array.isArray(window.LOCAL_PROJECTS) ? window.LOCAL_PROJECTS : [];
const IS_LOCAL = LOCAL.length > 0;
const imported = new Set(LOCAL.map((p) => p.behance).filter(Boolean));
const PROJECTS = [
  ...LOCAL.map((p) => ({ ...p, local: true })),
  ...(SHOW_SAMPLES || !IS_LOCAL ? SAMPLE_PROJECTS.filter((p) => !imported.has(p.id)) : []),
];
const HERO = IS_LOCAL ? window.LOCAL_HERO : SAMPLE_HERO;
