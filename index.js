const express = require("express");
const path = require("path");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   1️⃣ 前端畫面（重點）
========================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   2️⃣ Google Sheet 設定
========================= */
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

const sheets = google.sheets({ version: "v4", auth });

/* =========================
   3️⃣ API：搜尋怪物 / 掉落
========================= */
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q) {
    return res.json({ success: false, error: "缺少查詢參數" });
  }

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "工作表1!A:E"
    });

    const rows = result.data.values || [];
    const data = rows.slice(1); // 略過標題列

    const matches = data
      .filter(row => row[0] && row[0].includes(q))
      .map(row => ({
        monster: row[0] || "",
        item: row[1] || "",
        map: row[2] || "",
        rate: row[3] || "",
        note: row[4] || ""
      }));

    res.json({
      success: true,
      query: q,
      count: matches.length,
      results: matches
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Google Sheet 讀取失敗" });
  }
});

/* =========================
   4️⃣ 啟動 Server
========================= */
app.listen(PORT, () => {
  console.log(`cartest server running on port ${PORT}`);
});
