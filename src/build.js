const fs = require('fs')
const zlib = require('zlib')

const ejs = require('ejs')

const navLinks = [
  {
    href: '/',
    text: 'Home'
  },
  {
    href: '/sheets',
    text: 'Sheets additions'
  }
]

const mkdir = () => {
  // Might not be necessary but it does not hurt
  try {
    fs.mkdirSync('public')
  } catch (e) {
  }
}

const buildIndex = async (totalLength) => {
  console.log('buildIndex.html')

  const links = JSON.parse(JSON.stringify(navLinks))
  const indexObject = links.find((o) => o.href === '/')
  indexObject.current = true

  const indexHTML = await ejs.renderFile('src/templates/index.ejs', {
    navLinks: links,
    totalLength,
    title: 'Encora Recording Viewer'
  })

  fs.writeFileSync('public/index.html', indexHTML)
}

const buildSheetsHTML = async () => {
  console.log('buildSheetsHTML')

  const links = JSON.parse(JSON.stringify(navLinks))
  const sheetsObject = links.find((o) => o.href === '/sheets')
  sheetsObject.current = true

  const sheetsHTML = await ejs.renderFile('src/templates/sheets.ejs', {
    navLinks: links,
    title: 'Sheets additions'
  })

  fs.writeFileSync('public/sheets.html', sheetsHTML)
}

const compressCSV = async () => {
  // Statically compress the CSV for performance

  const brBuf = fs.readFileSync('src/static/recordings_2020-12-31.csv.br')
  const csv = zlib.brotliDecompressSync(brBuf)

  const filepath = 'public/recordings_2020-12-31.csv'

  console.log(`writing ${filepath}`)
  fs.writeFileSync(filepath, csv)

  const filepathGz = `${filepath}.gz`
  console.log(`writing ${filepathGz}`)
  fs.writeFileSync(filepathGz, zlib.gzipSync(csv, { level: 9 }))

  const totalLength = Buffer.byteLength(csv, 'utf8')
  console.log(`totalLength = ${totalLength}`)
  return totalLength
}

(async () => {
  mkdir()

  const totalLength = await compressCSV()

  await buildIndex(totalLength)
  await buildSheetsHTML()

  console.log('build complete')
})()
