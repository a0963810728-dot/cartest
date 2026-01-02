import express from 'express'
import { GoogleSpreadsheet } from 'google-spreadsheet'

const app = express()
const PORT = process.env.PORT || 3000

// Google Sheet 設定
const SHEET_ID = process.env.GOOGLE_SHEET_ID
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')

// 連線 Sheet
async function loadSheet() {
  const doc = new GoogleSpreadsheet(SHEET_ID)
  await doc.useServiceAccountAuth({
    client_email: CLIENT_EMAIL,
    private_key: PRIVATE_KEY,
  })
  await doc.loadInfo()
  return doc.sheetsByIndex[0]
}

// 首頁
app.get('/', (req, res) => {
  res.send('✅ cartest 怪物掉落查詢 API 已啟動')
})

// 查詢 API
app.get('/api/drop', async (req, res) => {
  const monster = req.query.monster?.trim()

  if (!monster) {
    return res.json({ success: false, message: '請提供 monster 參數' })
  }

  try {
    const sheet = await loadSheet()
    const rows = await sheet.getRows()

    const drops = rows
      .filter(r => r['怪物'] && r['怪物'].startsWith(monster + '=>'))
      .map(r => ({
        item: r['怪物'].split('=>')[1],
        map: r['地圖'] || '',
        rate: r['掉落機率'] || '',
        note: r['備註'] || '',
      }))

    res.json({
      success: true,
      monster,
      drops,
    })
  } catch (err) {
    console.error(err)
    res.json({ success: false, error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
