Package.describe({
	name: 'rocketchat:logger',
	version: '0.0.1',
	summary: 'Logger for Rocket.Chat',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'mongo',
		'random',
		'logging',
		'nooitaf:colors',
		'raix:eventemitter',
		'templating',
		'rocketchat:utils',
		'rocketchat:settings',
		'rocketchat:ui-utils',
		'rocketchat:authorization',
		'kadira:flow-router',
		'kadira:blaze-layout',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
