const express = require("express");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===== Google Sheet 認證 ===== */
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "工作表1"; // 如果不是這個名字，告訴我我幫你改

/* ===== 首頁（測試用） ===== */
app.get("/", (req, res) => {
  res.send("怪物掉落 API 已啟動");
});

/* ===== 查詢 API ===== */
app.get("/api/search", async (req, res) => {
  const keyword = (req.query.q || "").trim();

  if (!keyword) {
    return res.json({ success: false, message: "請輸入查詢關鍵字" });
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
    });

    const rows = response.data.values || [];

    const results = rows
      .filter(row => row[0] && row[0].includes(keyword)) // ★ 關鍵在這
      .map(row => ({
        monster: row[0],
        item: row[1] || "",
        map: row[2] || "",
        rate: row[3] || ""
      }));

    res.json({
      success: true,
      keyword,
      count: results.length,
      results
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Google Sheet 讀取失敗" });
  }
});

/* ===== 啟動伺服器 ===== */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
