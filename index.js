import express from 'express'
import { google } from 'googleapis'

const app = express()
const PORT = process.env.PORT || 3000

// Google Auth
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets.readonly']
)

const sheets = google.sheets({ version: 'v4', auth })

// 查詢 API
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) {
    return res.json({ success: false, results: [] })
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:E'
    })

    const rows = response.data.values || []
    const results = []

    for (let i = 1; i < rows.length; i++) {
      const [monster, item, map, rate, note] = rows[i]

      // ⭐ 核心重點：怪物 or 掉落物 都能查
      if (
        (monster && monster.includes(q)) ||
        (item && item.includes(q))
      ) {
        results.push({
          monster,
          item,
          map,
          rate,
          note
        })
      }
    }

    res.json({
      success: true,
      keyword: q,
      results
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})

// 前端頁面
app.use(express.static('public'))

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
