'use strict'

// Config babel-register to build our modules on demand.
// Note that this is separate from the ava config because that config
// is used to build the tests, while this config is used to build the modules
// under test. We aren't using a `.babelrc` or a "babel" field in package.json
// because globals are bad™.
require('babel-register')({
  presets: [
    require('babel-preset-modern-node/6.1'),
    require('babel-preset-stage-0'),
  ],
})
