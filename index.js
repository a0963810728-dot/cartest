const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 讓 Render 可以讀取 public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// ===== 假資料（之後可換成 DB）=====
const monsterDrops = {
  巴風特: ['巴風特之角', '祝福武器卷軸', '魔法書'],
  史萊姆: ['果凍', '空瓶'],
  不死鳥: ['不死鳥之羽', '火焰寶石'],
};

// ===== 查詢 API =====
app.get('/api/drop', (req, res) => {
  const monster = req.query.monster;

  if (!monster) {
    return res.json({
      success: false,
      message: '請提供怪物名稱',
    });
  }

  const drops = monsterDrops[monster] || [];

  res.json({
    success: true,
    monster,
    drops,
  });
});

// ===== 首頁測試 =====
app.get('/api/test', (req, res) => {
  res.json({ status: 'API OK' });
});

// ===== 啟動伺服器 =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
