const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
app.use(cors());
app.use(express.json());

// ====== Google Sheet 設定 ======
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

const auth = new google.auth.JWT(
  CLIENT_EMAIL,
  null,
  PRIVATE_KEY,
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

const sheets = google.sheets({ version: "v4", auth });

// ====== 首頁（測試用） ======
app.get("/", (req, res) => {
  res.send("✅ cartest 怪物掉落查詢 API 已啟動");
});

// ====== 查詢怪物掉落 ======
app.get("/api/drop", async (req, res) => {
  const monster = req.query.monster;

  if (!monster) {
    return res.json({ error: "請提供 monster 參數" });
  }

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A:E", // A=怪物 B=寶物 C=地圖 D=掉落機率 E=備註
    });

    const rows = result.data.values || [];
    const data = [];

    // 跳過標題列
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const monsterName = row[0] || "";
      if (monsterName.includes(monster)) {
        data.push({
          怪物: row[0] || "",
          寶物: row[1] || "",
          地圖: row[2] || "",
          掉落機率: row[3] || "",
          備註: row[4] || "",
        });
      }
    }

    if (data.length === 0) {
      return res.json({ message: "查無資料" });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "讀取 Google Sheet 失敗" });
  }
});

// ====== 啟動伺服器 ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
