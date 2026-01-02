const express = require("express");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const app = express();
const PORT = process.env.PORT || 3000;

/* ========= Google Sheet 設定 ========= */
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

/* ========= 讀取 Google Sheet ========= */
async function loadSheetRows() {
  if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error("Google Sheet 環境變數未設定完整");
  }

  const doc = new GoogleSpreadsheet(SHEET_ID);

  await doc.useServiceAccountAuth({
    client_email: CLIENT_EMAIL,
    private_key: PRIVATE_KEY,
  });

  await doc.loadInfo();

  // ⚠️ 工作表名稱必須是「工作表1」
  const sheet = doc.sheetsByTitle["工作表1"];
  if (!sheet) {
    throw new Error("找不到工作表：工作表1");
  }

  const rows = await sheet.getRows();
  return rows;
}

/* ========= API：搜尋（怪物 or 掉落物） ========= */
app.get("/api/search", async (req, res) => {
  const keyword = req.query.q?.trim();

  if (!keyword) {
    return res.json({ success: false, error: "缺少搜尋參數 q" });
  }

  try {
    const rows = await loadSheetRows();
    const result = [];

    rows.forEach((row) => {
      // A 欄格式：怪物=>掉落物
      const raw = row._rawData?.[0];
      if (!raw) return;

      if (raw.includes(keyword)) {
        const [monster, item] = raw.split("=>");

        result.push({
          monster: monster || "",
          item: item || "",
          map: row._rawData?.[2] || "",
          rate: row._rawData?.[3] || "",
          note: row._rawData?.[4] || "",
        });
      }
    });

    res.json({
      success: true,
      keyword,
      count: result.length,
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: "Google Sheet 讀取失敗",
      detail: err.message,
    });
  }
});

/* ========= 首頁 ========= */
app.get("/", (req, res) => {
  res.send(`
    <h2>✅ cartest 已成功上線</h2>
    <p>API 使用方式：</p>
    <code>/api/search?q=梅杜莎</code>
  `);
});

/* ========= 啟動 ========= */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
