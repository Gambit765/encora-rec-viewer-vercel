const { extractSheets } = require('spreadsheet-to-json')

module.exports = async (req, res) => {
  const sheets = await extractSheets({
    spreadsheetKey: process.env.SPREADSHEET_KEY,
    credentials: process.env.SHEETS_API_KEY
  })

  const data = []
  // extractSheets puts the row data for each sheet under their respective names
  // Here we merge them into one
  for (const sheet in sheets) {
    data.push(...sheets[sheet])
  }

  // res.status(200)
  return res.json(data)
}
