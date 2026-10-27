// 網站資料：來自 npm run photos 產生的 photos.js
const CATEGORIES = { portrait: "人像", landscape: "風景", concept: "概念創作" };

const PROJECTS = Array.isArray(window.LOCAL_PROJECTS) ? window.LOCAL_PROJECTS : [];
const HERO = Array.isArray(window.LOCAL_HERO) ? window.LOCAL_HERO : [];
