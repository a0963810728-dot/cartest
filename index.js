const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 首頁
app.get("/", (req, res) => {
  res.send("✅ cartest 已成功在 Render 上線！");
});

// 測試 API
app.get("/api/test", (req, res) => {
  res.json({ ok: true, message: "API 正常運作" });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
