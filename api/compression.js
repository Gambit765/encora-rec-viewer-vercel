module.exports = async (req, res) => {
  const ACCEPT_ENCODING = req.headers['accept-encoding'] ?? ''

  let out = ''

  if ((ACCEPT_ENCODING.indexOf('br') ?? -1) !== -1) {
    out += 'brotliEnabled=true;'
  }

  if ((ACCEPT_ENCODING.indexOf('gzip') ?? -1) !== -1) {
    out += 'gzipEnabled=true;'
  }

  res.status(200)
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/javascript')
  res.send(out)
}
