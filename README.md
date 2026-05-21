# 中文測驗 App｜Chinese Quiz for HSK1 / TOCFL

針對母語英文、HSK1 與 TOCFL 萌芽級／成長級程度的 12 歲學生設計的中文測驗網站。
所有題目均使用 **繁體中文**，並同時附上 **漢語拼音** 與 **注音符號**。

- **學生端** `/student` — 名字 → 老師指派 / 自由練習 → 互動測驗 → 成績與作答檢討
- **教師端** `/admin` — AI 對話產生題目、題庫管理、學生指派、成績總覽

---

## 目錄

1. [功能總覽](#功能總覽)
2. [技術架構](#技術架構)
3. [專案結構](#專案結構)
4. [本機開發](#本機開發)
5. [環境變數](#環境變數)
6. [部署到 Vercel](#部署到-vercel)
7. [資料模型](#資料模型)
8. [API 端點參考](#api-端點參考)
9. [維護常見任務](#維護常見任務)
10. [安全與備註](#安全與備註)

---

## 功能總覽

### 學生端 `/student`

| 階段 | 功能 |
|------|------|
| Welcome | 輸入名字後點 Continue；名字會用來查詢老師指派 |
| Picker | 顯示老師指派的任務（如有），以及「自由練習」區（選主題 + 題數） |
| Quiz | 進度條 / 分數即時顯示、答題後立刻顯示正解與發音、雙語 feedback banner |
| Result | 圓形分數環、All / Wrong only 切換的作答檢討、Retry 或回主畫面 |

- **三種題型**：
  - `image_to_word` — 看圖選字（顯示 emoji 或 AI 生成圖片）
  - `word_to_meaning` — 看中文選英文（避免 cheat：選項只顯示英文）
  - `meaning_to_word` — 看英文選中文
- **題數預設**：永遠是 **All questions**；學生想要少做才另外選 5/10/15/20
- **主題題數限制**：題目少於 10 題的主題只能選 All，避免被切到沒題目可答
- **正解位置隨機**：每題的正確選項位置會被隨機洗牌（不再永遠是選項 1）

### 教師端 `/admin`

| 分頁 | 功能 |
|------|------|
| **AI Generator** | 跟 Gemini 對話產生題目，可選「鎖定某位學生最常錯的字」做客製練習；右側預覽後一鍵存入題庫 |
| **Question Bank** | 依主題收合的手風琴列表；新增 / 編輯 / 刪除題目；改名 / 刪除主題；恢復內建題庫；拼音／注音 AI 補齊；圖片題目可一鍵 AI 重新生成插畫 |
| **Students** | 新增學生 + 指派主題（含題數與備註）；學生列表顯示平均分數；點開可看歷次成績、答錯最多的字、目前指派 |
| **All Results** | 全部測驗紀錄、依名字篩選；統計卡片（總測驗數、平均、各主題平均）；可單筆或全部刪除；窄螢幕（≤480px）會自動轉成卡片式排版 |

### 自動化亮點

- **拼音／注音自動補齊**：新增題目或編輯時，拼音 / 注音留空會在儲存當下用 Gemini 自動補上
- **AI 圖片生成**：圖片題的 ✨ 按鈕用 Hugging Face FLUX.1-schnell 生成插畫；按一次拿一張，每次都用新 seed 所以不會重複
- **題型感知 UI**：非 picture 題型自動隱藏 Visual 欄位與 ✨ 按鈕，避免儲存無用的 emoji
- **行動裝置適配**：手機 / 平板都有專門的 layout，題庫列表、All Results 表格、教師工具列都會自動調整

---

## 技術架構

### 後端

- **Runtime**: Node.js 18+（Vercel 上自動使用最新 LTS）
- **Framework**: Express 4
- **AI**:
  - 文字 / JSON 產生（題目、拼音、注音）：**Google Gemini `gemini-2.5-flash`**
  - 圖片生成：**Hugging Face `black-forest-labs/FLUX.1-schnell`**（透過 Inference Providers router）
- **持久化**:
  - 本機：`data/questions.json`、`data/results.json`、`data/assignments.json`（gitignored）
  - 正式：**Vercel KV**（Upstash Redis） — `read('questions')` / `write('questions', …)` 同一份介面

### 前端

- **CSS**: Bootstrap 5.3（CDN 載入） + 客製主題（珊瑚紅 / 橘 / 黃漸層）
- **JS**: 原生 Vanilla JS，無前端框架
- **可離線降級**: Bootstrap 從 CDN 載入；主程式 `quiz.js` / `admin.js` 為本地檔案

---

## 專案結構

```
.
├── api/
│   └── index.js                # Vercel serverless wrapper（直接 re-export server.js 的 app）
├── data/                       # 本機 JSON 儲存（gitignored）
│   ├── questions.json
│   ├── results.json
│   └── assignments.json        # 老師指派
├── public/
│   ├── admin/
│   │   ├── index.html          # 教師後台
│   │   ├── admin.js
│   │   └── admin.css
│   └── student/
│       ├── index.html          # 學生頁
│       ├── quiz.js
│       └── quiz.css
├── routes/
│   ├── quiz.js                 # /api/quiz/*  學生用
│   ├── admin.js                # /api/admin/* 教師用
│   └── ai.js                   # /api/ai/*    AI 對話
├── utils/
│   ├── database.js             # read/write（本機 JSON 或 Vercel KV 二擇一）
│   ├── seedData.js             # 內建 70 題（7 主題 × 10 題）
│   └── aiHelper.js             # Gemini chatWithAI / generateText、HF generateImage
├── server.js                   # Express app；直接執行進入監聽，被 require 時只 export app
├── vercel.json                 # Vercel 路由：所有請求轉給 api/index.js
├── package.json
└── README.md
```

---

## 本機開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定 `.env`

複製範本：

```bash
cp .env.example .env
```

然後填入你的 API keys：

```env
GEMINI_API_KEY=AIza...               # 必填，AI 出題與拼音／注音補齊
HF_TOKEN=hf_...                       # 必填（如果要用 ✨ AI 圖片功能）
PORT=3000                             # 可選，預設 3000
```

### 3. 啟動

```bash
npm start            # 一次性啟動
npm run dev          # nodemon，檔案變動會自動重啟
```

- 學生：<http://localhost:3000/student>
- 教師：<http://localhost:3000/admin>

### 4. 第一次開啟教師後台

如果 `data/questions.json` 不存在，`utils/database.js` 會自動使用 `utils/seedData.js` 的 70 題作為預設值。
如果已經有舊資料但少了某些 seed 題，可以點題庫頁右上角的 **↺ Restore Defaults**。

---

## 環境變數

| 變數 | 用途 | 是否必填 | 取得方式 |
|------|------|---------|---------|
| `GEMINI_API_KEY` | AI 對話產生題目、拼音／注音 backfill | 是 | <https://aistudio.google.com/apikey>（免費） |
| `HF_TOKEN` | FLUX.1-schnell 圖片生成；token scope 需勾 *Make calls to Inference Providers* | 用 ✨ 功能時必填 | <https://huggingface.co/settings/tokens> |
| `PORT` | 本機監聽 port | 否，預設 3000 | 自行決定 |
| `KV_REST_API_URL` | Vercel KV REST endpoint | 部署到 Vercel 時必填 | Vercel KV 連結時自動注入 |
| `KV_REST_API_TOKEN` | Vercel KV 寫入 token | 部署到 Vercel 時必填 | Vercel KV 連結時自動注入 |

> 程式判斷 `process.env.KV_REST_API_URL` 是否存在來決定走 KV 或本機 JSON，所以你在本機就算沒填 KV 變數也沒問題。

---

## 部署到 Vercel

> 已經部署過、只是要重新發版？直接 `git push` 即可，Vercel 會自動偵測並重建。

### Step 1：建立 GitHub repo

打開 <https://github.com/new>

- Owner: `jbmnkdesign`
- Repository name: 任意（例如 `chinese-quiz`）
- Public 或 Private 都可
- **不要** 勾任何「Add README」「.gitignore」「license」（會跟我們的檔案衝突）
- 按 **Create repository**

### Step 2：推程式碼上 GitHub

```bash
git remote add origin https://github.com/jbmnkdesign/chinese-quiz.git
git branch -M main
git push -u origin main
```

第一次 push 會跳出 GitHub 登入頁，登入授權即可。

### Step 3：在 Vercel 匯入專案

1. 開 <https://vercel.com> → **Continue with GitHub** 登入（用 jbmnkdesign 帳號）
2. Dashboard → **Add New... → Project**
3. 找到剛剛的 repo → **Import**
4. **完全不要改任何設定** → **Deploy**
5. 等 1〜2 分鐘部署完成

> 第一次部署因為缺 API key / KV 連線，網頁可能會掛掉，這是正常的。

### Step 4：建立 Vercel KV 資料庫

1. 在專案頁上方點 **Storage** 分頁
2. **Create Database** → 選 **KV**（Upstash Redis）
3. 名稱填 `chinese-quiz-kv`；Region 選 **Singapore** 或 **Tokyo**
4. **Create** → **Connect Project** → 確認連到此專案
5. Vercel 會自動把 `KV_REST_API_URL`、`KV_REST_API_TOKEN` 注入環境變數

### Step 5：設定 API keys

進專案 → **Settings → Environment Variables**：

| Name | Value | Environments |
|------|-------|-------------|
| `GEMINI_API_KEY` | <https://aistudio.google.com/apikey> 取得的 key | ✅ Production ✅ Preview |
| `HF_TOKEN` | <https://huggingface.co/settings/tokens> 取得的 token | ✅ Production ✅ Preview |

> **Development** 欄位 Vercel 會鎖住，不用管。

### Step 6：重新部署讓變數生效

**Deployments** 分頁 → 最新一筆 → **⋯** → **Redeploy** → Confirm。
或者跑下面這個小指令推一個空 commit：

```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

### Step 7：完成

- 學生連結：`https://<your-project>.vercel.app/student`
- 教師連結：`https://<your-project>.vercel.app/admin`

要改 URL 的話進 **Settings → Domains** 加自訂域名或調整子網域。

### 之後更新

```bash
git add .
git commit -m "你做了什麼"
git push
```

Push 到 `main` Vercel 就會自動跑新部署。

---

## 資料模型

### `Question`

```jsonc
{
  "id": "seed-001",
  "topic": "Animals",
  "type": "image_to_word",          // image_to_word | word_to_meaning | meaning_to_word
  "question_en": "What is this?",
  "emoji": "🐱",                    // 只在 image_to_word 使用；其他類型為 ""
  "imageUrl": "data:image/jpeg;base64,…",  // 同上；AI 生成或人工貼上後的圖片
  "answer": { "chinese": "貓", "pinyin": "māo", "zhuyin": "ㄇㄠ", "english": "cat" },
  "options": [ /* 4 個與 answer 同 schema 的物件 */ ],
  "correctIndex": 1,                // 0–3，隨機分布
  "createdAt": "2026-05-19T00:00:00.000Z",
  "updatedAt": "…"                  // 編輯後才有
}
```

### `Assignment`

```jsonc
{
  "id": "uuid",
  "studentName": "Andy",
  "topics": ["Animals", "Greetings"],
  "questionCount": 10,
  "notes": "Practice before Friday's quiz",
  "createdAt": "2026-05-21T07:13:00.000Z"
}
```

### `Result`

```jsonc
{
  "id": "uuid",
  "studentName": "Andy",
  "topic": "Animals",
  "assignmentId": null,             // 自由練習為 null；指派任務則填 assignment.id
  "score": 8,
  "total": 10,
  "percentage": 80,
  "duration": 47,                   // 秒
  "answers": [
    {
      "questionId": "seed-001",
      "topic": "Animals",
      "chinese": "貓",
      "pinyin": "māo",
      "zhuyin": "ㄇㄠ",
      "english": "cat",
      "correct": true,
      "timeTaken": 5
    }
  ],
  "timestamp": "2026-05-21T08:00:00.000Z"
}
```

---

## API 端點參考

### 學生用 `/api/quiz/*`

| Method | Path | 用途 |
|--------|------|------|
| GET | `/api/quiz/topics` | 取得 `[{ name, count }, …]` 主題清單 |
| GET | `/api/quiz/questions?topic=Animals&limit=10` | 取題目（topic 可逗號多選或 `all`） |
| GET | `/api/quiz/assignment/:studentName` | 該學生未完成的指派 |
| POST | `/api/quiz/results` | 提交一次測驗結果 |

### 教師用 `/api/admin/*`

題目／主題管理：

| Method | Path | 用途 |
|--------|------|------|
| GET | `/api/admin/questions` | 全部題目 |
| POST | `/api/admin/questions` | 批次新增（body: `{ questions: [...] }`，會自動補拼音／注音並洗牌正解位置） |
| PATCH | `/api/admin/questions/:id` | 編輯單題 |
| DELETE | `/api/admin/questions/:id` | 刪除單題 |
| PATCH | `/api/admin/topics` | 改主題名（body: `{ oldName, newName }`） |
| DELETE | `/api/admin/topics/:name` | 刪整個主題（與所有題目） |

AI / 維護工具：

| Method | Path | 用途 |
|--------|------|------|
| POST | `/api/admin/questions/:id/generate-image` | 用 Hugging Face FLUX 重新生成圖片 |
| POST | `/api/admin/backfill-zhuyin` | 掃整個題庫，補上缺失的拼音與注音 |
| GET | `/api/admin/restore-seed/status` | 查還剩幾筆 seed 題沒匯入（前端用來決定 Restore 按鈕是否顯示） |
| POST | `/api/admin/restore-seed` | 把 `utils/seedData.js` 裡新加的題目補進題庫（既有的不動） |
| POST | `/api/admin/resync-seed` | 用 seedData 的最新版本覆寫所有 seed-ID 列；非 seed 的自訂題目不受影響 |
| POST | `/api/admin/shuffle-correct-positions` | 對全題庫重洗正解位置（修正舊資料都是 correctIndex 0 的問題） |
| POST | `/api/admin/strip-non-picture-visuals` | 清除非 picture 題型上殘留的 emoji / imageUrl |

學生 / 成績：

| Method | Path | 用途 |
|--------|------|------|
| GET | `/api/admin/students` | 學生列表（含平均分數、測驗數、指派數） |
| GET | `/api/admin/students/:name` | 單一學生詳情（歷次成績、最常錯的字、目前指派） |
| GET | `/api/admin/assignments` | 全部指派 |
| POST | `/api/admin/assignments` | 新增指派 |
| DELETE | `/api/admin/assignments/:id` | 刪除指派 |
| GET | `/api/admin/results` | 全部測驗結果 |
| GET | `/api/admin/results/summary` | 統計摘要（總數、平均、各主題） |
| DELETE | `/api/admin/results` | 清空所有結果 |
| DELETE | `/api/admin/results/:id` | 刪單筆結果 |

### AI `/api/ai/*`

| Method | Path | 用途 |
|--------|------|------|
| POST | `/api/ai/chat` | 教師端「AI Generator」對話；body: `{ message, conversationHistory, studentName? }` |

---

## 維護常見任務

### 加入新題目

兩條路：

1. **AI 對話產生**：教師後台 → AI Generator → 輸入「請給我 10 題關於旅行的問題」→ Gemini 會回 JSON → 預覽 → Save to Bank
2. **手動新增**：題庫頁右上 ➕ Add Question → 填表單。拼音、注音留空，存檔時會自動補

### 加入新的內建主題

編輯 `utils/seedData.js`：

1. 在 `W` 字典加入新詞（含 chinese / pinyin / zhuyin / english）
2. 在 `seedQuestions` 陣列加入 10 道 `Q(...)`，第三個參數是題型，第四個是 emoji（非 picture 題型會被自動清掉）
3. push 後在正式環境跑一次 `POST /api/admin/resync-seed`（或叫老師點題庫頁的 ↺ Restore Defaults）

### 對既有資料做一次性清理

部署後想清除舊資料的問題（例如 correctIndex 都是 0），直接 curl 對應端點：

```bash
# 重新洗牌正解位置
curl -X POST https://<your>.vercel.app/api/admin/shuffle-correct-positions

# 清掉非 picture 題上的 emoji
curl -X POST https://<your>.vercel.app/api/admin/strip-non-picture-visuals

# 用最新 seed 覆寫所有 seed-ID 列
curl -X POST https://<your>.vercel.app/api/admin/resync-seed
```

### 看實時錯誤

`utils/aiHelper.js` 和 `routes/admin.js` 都會把錯誤訊息原文丟給前端 toast，所以多半在畫面右上就看得到。
要更詳細的 stack 進 Vercel → Logs → Functions。

---

## 安全與備註

- `.env` 永遠不會上傳（已在 `.gitignore`）
- API keys 只存在 Vercel 環境變數，不會出現在 commit 裡
- 學生成績 / 指派資料儲存在 Vercel KV，受 Vercel 帳號保護
- 題目圖片以 `data:image/jpeg;base64,…` 內嵌儲存，沒有外部 CDN 依賴；缺點是單題可能上 100KB，70 題滿庫大約 5MB
- Express body limit 已調到 `4mb` 以容納教師上傳壓縮後的圖片
- 學生輸入的名字會經過 `escapeHtml` 處理；題庫的 HTML 也透過 `escapeHtml` / `escapeAttr` 注入，可抵擋常見 XSS

---

如果遇到問題：

1. 先看 Vercel **Logs → Functions** 有沒有錯誤
2. 確認 `GEMINI_API_KEY` 和 `HF_TOKEN` 都在 Environment Variables 裡
3. 確認 KV Database 顯示已連結（Storage 分頁）
4. 確認 `git log` 最後一筆 commit 已被 Vercel 部署成功
