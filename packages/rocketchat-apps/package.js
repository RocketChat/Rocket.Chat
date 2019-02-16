Package.describe({
	name: 'rocketchat:apps',
	version: '1.0.0',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:markdown',
		'rocketchat:utils',
		'rocketchat:settings',
		'rocketchat:models',
		'rocketchat:notifications',
		'rocketchat:ui-utils',
		'rocketchat:authorization',
		'rocketchat:ui-cached-collection',
		'templating',
	]);
	api.use([
		'reactive-var',
		'kadira:flow-router',
		'kadira:blaze-layout',
		'underscore',
	], 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
