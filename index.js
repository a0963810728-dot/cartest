import express from 'express'
import { GoogleSpreadsheet } from 'google-spreadsheet'

const app = express()
const PORT = process.env.PORT || 3000

const SHEET_ID = process.env.GOOGLE_SHEET_ID
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')

async function loadSheet() {
  const doc = new GoogleSpreadsheet(SHEET_ID)
  await doc.useServiceAccountAuth({
    client_email: CLIENT_EMAIL,
    private_key: PRIVATE_KEY,
  })
  await doc.loadInfo()
  return doc.sheetsByIndex[0]
}

app.get('/', (req, res) => {
  res.send('✅ 怪物 / 掉落 查詢 API 已啟動')
})

/**
 * 通用查詢 API
 * ?q=梅杜莎
 * ?q=長劍
 */
app.get('/api/search', async (req, res) => {
  const q = req.query.q?.trim()
  if (!q) {
    return res.json({ success: false, message: '請提供 q 參數' })
  }

  try {
    const sheet = await loadSheet()
    const rows = await sheet.getRows()

    const results = []

    rows.forEach(r => {
      if (!r['怪物']) return

      const [monster, item] = r['怪物'].split('=>')

      // 模糊比對（怪物 or 掉落物）
      if (
        monster.includes(q) ||
        (item && item.includes(q))
      ) {
        results.push({
          monster,
          item,
          map: r['地圖'] || '',
          rate: r['掉落機率'] || '',
          note: r['備註'] || '',
        })
      }
    })

    res.json({
      success: true,
      query: q,
      count: results.length,
      results,
    })
  } catch (err) {
    console.error(err)
    res.json({ success: false, error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
