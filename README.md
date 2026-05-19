# 中文測驗 App｜Chinese Quiz for HSK1 / TOCFL

針對母語英文、HSK1 與 TOCFL 萌芽級／成長級程度的 12 歲學生設計的中文測驗網站。

- **學生端** `/student` — 互動式測驗，所有題目附漢語拼音
- **教師端** `/admin` — 用 AI 對話產生題目、管理題庫、查看學生成績

---

## 本機執行

```bash
npm install
# 在 .env 加入 ANTHROPIC_API_KEY=sk-ant-...
npm start
```
- 學生：http://localhost:3000/student
- 教師：http://localhost:3000/admin

本機模式會用 `data/*.json` 存資料（已加入 .gitignore）。

---

## 部署到 Vercel（給學生公開連結）

### Step 1：建立 GitHub repo

打開 https://github.com/new

- Owner: `jbmnkdesign`
- Repository name: `chinese-quiz`（或任何你想要的名字）
- 設為 **Public** 或 **Private** 都可以
- **不要** 勾任何「Add README」「.gitignore」「license」選項（會跟我們的程式衝突）
- 按 **Create repository**

### Step 2：把程式碼推上 GitHub

在專案資料夾打開 PowerShell（或 cmd），執行：

```bash
git remote add origin https://github.com/jbmnkdesign/chinese-quiz.git
git branch -M main
git push -u origin main
```

第一次 push 時瀏覽器會跳出 GitHub 登入頁，登入後授權即可。

### Step 3：在 Vercel 部署

1. 打開 https://vercel.com → 用 **Continue with GitHub** 登入（用 jbmnkdesign 帳號）
2. 進入 Dashboard → 點 **Add New... → Project**
3. 找到 `chinese-quiz` repo → 點 **Import**
4. **不要改任何設定**，直接點 **Deploy**
5. 等 1-2 分鐘部署完成

> 此時點開部署網址會看到錯誤訊息（因為還沒設定 API key 和資料庫），這是正常的，繼續下一步。

### Step 4：建立 Vercel KV 資料庫

1. 在剛才的專案頁面，點上方的 **Storage** 分頁
2. 點 **Create Database** → 選 **KV** (Upstash 提供的 Redis)
3. Database Name 填 `chinese-quiz-kv`，Region 選 **Singapore** 或 **Tokyo**（離台灣最近）
4. 點 **Create** → 然後點 **Connect Project** → 確認連結到 `chinese-quiz`
5. Vercel 會自動把 `KV_REST_API_URL`、`KV_REST_API_TOKEN` 等環境變數注入專案

### Step 5：設定 Anthropic API Key

1. 在專案頁面點 **Settings** → 左側選 **Environment Variables**
2. 加入新變數：
   - Name: `ANTHROPIC_API_KEY`
   - Value: 你的 API key（`sk-ant-...`）
   - Environments: 三個全勾（Production、Preview、Development）
3. 點 **Save**

### Step 6：觸發重新部署

1. 在專案頁面點 **Deployments** 分頁
2. 找到最新一筆部署，點右邊的 **⋯** → **Redeploy**
3. 確認後等 1-2 分鐘

### Step 7：完成！分享連結

- **學生連結**：`https://chinese-quiz-xxxxx.vercel.app/student`
- **教師後台**：`https://chinese-quiz-xxxxx.vercel.app/admin`

實際網址會在 Vercel Dashboard 上方顯示，可以自訂為更短的網址。

---

## 之後要修改程式碼

只要 push 到 GitHub 的 main 分支，Vercel 會自動重新部署：

```bash
git add .
git commit -m "更新內容"
git push
```

---

## 安全注意事項

- `.env` 檔案永遠不會上傳到 GitHub（已在 .gitignore 排除）
- API key 只存在 Vercel 環境變數設定裡，不會出現在程式碼中
- 學生成績資料存在 Vercel KV，受 Vercel 帳號保護
