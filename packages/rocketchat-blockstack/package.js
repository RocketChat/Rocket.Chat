Package.describe({
  name: 'rocketchat:blockstack',
  version: '0.0.0',
  summary: 'Auth handler and utilities for Blockstack',
  git: ''
})

Package.onUse((api) => {
  api.use('modules')
  api.use('ecmascript')
  api.use('less')
  api.use('templating', 'client')
  api.use('aldeed:template-extension@4.1.0', 'client')

  api.addAssets([
    'assets/blockstack_mark.png'
  ], 'client')

  api.addFiles('client/stylesheets/blockstackLogin.less', 'client')
  api.addFiles('client/views/blockstackLogin.html', 'client')
  api.addFiles('client/views/blockstackLogin.js', 'client')
  api.mainModule('client/index.js', 'client')
  api.mainModule('server/index.js', 'server')
  api.export('Blockstack')
})
