import fs from 'fs'
import path from 'path'
import express from 'express'
import webpack from 'webpack'
import webpackMiddleware from 'webpack-dev-middleware'
import config from './webpack.config.js'

const port = 5000
const app = express()

const compiler = webpack(config)
const middleware = webpackMiddleware(compiler, {
  publicPath: config.output.publicPath,
  contentBase: 'src',
  stats: {
    colors: true,
    hash: false,
    timings: true,
    chunks: false,
    chunkModules: false,
    modules: false,
  },
})

app.use(middleware)

app.get('/', function (req, res) {
  res.write(fs.readFileSync(path.join(__dirname, 'index.html')))
  res.end()
})

app.listen(port, '0.0.0.0', err => {
  if (err) console.log(err)
  else console.info(`Open http://localhost:${port}/ in your browser.`)
})
