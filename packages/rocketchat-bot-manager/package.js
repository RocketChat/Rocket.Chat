Package.describe({
	name: 'rocketchat:bot-manager',
	version: '0.0.1',
	summary: 'Package to monitor and manage bot accounts',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use(['mongo',
		'ecmascript',
		'templating',
		'accounts-base',
		'underscore',
		'babel-compiler',
		'tracker',
		'reactive-var',
		'rocketchat:lib',
		'rocketchat:authorization',
		'rocketchat:settings',
		'rocketchat:api',
		'rocketchat:models',
		'rocketchat:theme',
		'rocketchat:logger',
		'rocketchat:ui-flextab',
		'rocketchat:ui-utils',
	]);

	api.use(['kadira:flow-router',
		'kadira:blaze-layout'], 'client');

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
