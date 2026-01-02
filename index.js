import express from "express";
import { google } from "googleapis";

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Google Sheet Auth =====
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  // ⭐⭐⭐ 關鍵就在這一行 ⭐⭐⭐
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

const sheets = google.sheets({ version: "v4", auth });

// ===== API：搜尋怪物 or 掉落物 =====
app.get("/api/search", async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) {
    return res.json({ success: false, error: "缺少查詢參數 q" });
  }

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "工作表1!A:E",
    });

    const rows = result.data.values || [];
    const data = rows.slice(1); // 跳過標題列

    const matched = data.filter(row =>
      row.some(cell => cell && cell.includes(q))
    );

    res.json({
      success: true,
      query: q,
      count: matched.length,
      results: matched.map(r => ({
        monster: r[0] || "",
        item: r[1] || "",
        map: r[2] || "",
        rate: r[3] || "",
        note: r[4] || ""
      }))
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Google Sheet 讀取失敗" });
  }
});

// ===== 首頁 =====
app.get("/", (req, res) => {
  res.send("cartest API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
