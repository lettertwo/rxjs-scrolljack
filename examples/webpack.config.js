const path = require('path')

module.exports = {
  entry: [
    path.resolve('./example'),
  ],
  output: {
    path: path.resolve('./built'),
    filename: 'bundle.js',
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
