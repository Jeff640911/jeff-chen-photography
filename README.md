# Jeff Chen Photography

## 匯入照片

```bash
npm install
npm run photos -- "/照片/原始資料夾"
```

- 原始資料夾裡的**每個子資料夾是一個系列**，名稱前可加數字控制順序，例如 `01-成田山-阿璃`。
- 支援 JPG、PNG、TIFF、WebP、AVIF，會依照 EXIF 自動轉正，並讀取相機、鏡頭、光圈、快門、ISO。
- 每張照片產生三種 WebP：`-s`（800px，網格）、`-m`（1600px，相簿）、`-l`（2560px，燈箱與主視覺），放在 `images/`。
- 原始資料夾不會被修改。資料夾路徑會記在 `projects.json`，之後只要執行 `npm run photos`；已產生過的縮圖會跳過，刪掉的原圖會一併清掉縮圖。

## 編輯系列資料：`projects.json`

第一次執行會替每個資料夾加入預設值，改完再執行一次 `npm run photos`。

| 欄位 | 說明 |
|---|---|
| `title` / `en` | 中文標題 / 英文副標 |
| `category` | `portrait`、`landscape`、`concept` |
| `year`, `date`, `place`, `model`, `tools` | 顯示在專案頁的資訊（空白就不顯示） |
| `intro` | 系列介紹 |
| `cover` | 封面檔名 |
| `slug` | 網址代號（選填，預設用資料夾名稱） |
| `hidden` | `true` 時不放上網站 |
| `behance` | 對應的 Behance 專案編號（選填），網站會隱藏該系列的示意圖 |

還沒匯入的系列會先顯示 Behance 示意圖；全部匯入後，把 `data.js` 的 `SHOW_SAMPLES` 改成 `false`。

> 上線時只需要上傳網站檔案和 `images/`，**不要上傳 `Photo/` 原始照片資料夾與 `node_modules/`**。

`hero` 是首頁輪播的照片，格式為 `"資料夾/檔名"`。

## 預覽

```bash
npm run dev
```

打開 http://localhost:8765 。還沒匯入照片時，網站會顯示 Behance 示意圖。
