const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   Google Credentials（雲端專用）
   =============================== */

// Render / 雲端：用環境變數寫成檔案
const credPath = path.join(__dirname, "google-credentials.json");

if (process.env.GOOGLE_CREDENTIALS_JSON && !fs.existsSync(credPath)) {
  fs.writeFileSync(
    credPath,
    process.env.GOOGLE_CREDENTIALS_JSON,
    "utf8"
  );
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
}

/* ===============================
   Google Sheet Auth
   =============================== */

const auth = new google.auth.GoogleAuth({
  // 本機：用 json 檔
  // 雲端：用上面寫出的 google-credentials.json
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(__dirname, "cartest-482711-1fedea9dd3d6.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

const spreadsheetId = "1AE_no7yRQ2rURrEBIrCUEVaoHnMfYpAZT1MCsZVU_WE";

/*
Sheet 結構：
A：怪物=>寶物
B：寶物（未使用）
C：地圖
D：掉落機率（基準 10000）
E：備註
*/

function norm(v) {
  return (v ?? "").toString().trim().toLowerCase();
}

// ✅ 機率只做數值換算（不加 %）
function formatRate(v) {
  const raw = String(v ?? "").trim();
  if (!raw) return "";

  const n = Number(raw);
  if (Number.isFinite(n)) {
    return n / 10000;
  }
  return "";
}

// 拆 A 欄：怪物=>寶物
function splitMonsterItem(cell) {
  const s = String(cell ?? "").trim();
  if (!s) return { monster: "", item: "" };

  const parts =
    s.includes("=>") ? s.split("=>") :
    s.includes("⇒") ? s.split("⇒") :
    [s];

  if (parts.length >= 2) {
    return {
      monster: parts[0].trim(),
      item: parts.slice(1).join("=>").trim()
    };
  }

  return { monster: "", item: s };
}

/* ===============================
   Routes
   =============================== */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/search", async (req, res) => {
  try {
    const keyword = norm(req.query.keyword);
    if (!keyword) return res.json([]);

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "drops!A2:E"
    });

    const rows = result.data.values || [];
    const out = [];

    for (const row of rows) {
      const a = row[0] || ""; // A：怪物=>寶物
      const c = row[2] || ""; // C：地圖
      const d = row[3] || ""; // D：掉落機率
      const e = row[4] || ""; // E：備註

      const { monster, item } = splitMonsterItem(a);

      const hit =
        norm(monster).includes(keyword) ||
        norm(item).includes(keyword) ||
        norm(a).includes(keyword);

      if (hit) {
        out.push({
          monster,
          item,
          map: c,
          rate: formatRate(d), // ✅ 純數字
          note: e
        });
      }
    }

    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   Listen（雲端必備）
   =============================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
