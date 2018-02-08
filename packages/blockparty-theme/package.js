Package.describe({
	name: 'blockparty:theme',
	version: '0.0.0',
	summary: 'BlockParty theme customisations.',
	git: ''
})

Package.onUse((api) => {
  api.use([
    'modules',
		'ecmascript',
    'rocketchat:lib',
		'rocketchat:theme',
  ])

  api.use([
    'aldeed:template-extension@4.1.0',
    'templating',
    'less'
  ], 'client')

  api.addFiles([
    'server.js'
  ], 'server')

  api.addFiles([
    'theme.less'
  ], 'client')

})
