const fs = require('fs')
const path = require('path')

module.exports = {
  entry: fs.readdirSync(__dirname)
    .filter(filename => fs.statSync(filename).isDirectory())
    .map(dirname => [dirname, path.resolve(path.join(dirname, 'example.js'))])
    .filter(([dirname, filename]) => fs.existsSync(filename))
    .reduce((entries, [dirname, filename]) => ({
      ...entries,
      [dirname]: filename,
    }), {}),
  output: {
    path: path.resolve('./built'),
    filename: '[name]/bundle.js',
  },
  devtool: 'module-inline-source-map',
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      query: {
        presets: [
          path.resolve('./node_modules/babel-preset-modern-node'),
          path.resolve('./node_modules/babel-preset-react'),
          path.resolve('./node_modules/babel-preset-stage-0'),
        ],
      },
      exclude: /node_modules/,
    }],
  },
  resolve: {
    alias: {
      'rxjs-scrolljack': path.resolve('../src/index'),
    },
  },
}
