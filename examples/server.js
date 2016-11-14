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

app.get('*', function (req, res) {
  let filepath = path.join(__dirname, decodeURIComponent(req.path))

  // Index file support.
  if (filepath[filepath.length - 1] === '/') {
    filepath = path.join(filepath, 'index.html')
  }

  let stats
  try {
    stats = fs.statSync(filepath)
    if (stats.isDirectory()) {
      // If we found a dir, look for an index.html.
      filepath = path.join(filepath, '/index.html')
      stats = fs.statSync(filepath)
    }
  } catch (err) {
    const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR']
    if (~notfound.indexOf(err.code)) {
      return res.status(404).send('Not Found')
    } else {
      console.error(err)
      return res.status(500).send('Server Error')
    }
  }

  res.write(fs.readFileSync(filepath))
  res.end()
})

app.listen(port, '0.0.0.0', err => {
  if (err) console.log(err)
  else console.info(`Open http://localhost:${port}/ in your browser.`)
})
