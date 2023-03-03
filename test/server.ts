import express from 'express'
const app = express()
const $ = console.log
app.listen(8080)
$('server: listening on port 8080')

app.all('*', function (req, res, next) {
    $(req.method, req.url, req.headers)
    res.json({ ok: true })
    next()
})
