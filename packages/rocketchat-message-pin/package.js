Package.describe({
	name: 'rocketchat:message-pin',
	version: '0.0.1',
	summary: 'Pin Messages',
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'rocketchat:ui-utils',
		'rocketchat:utils',
		'rocketchat:settings',
		'rocketchat:authorization',
		'rocketchat:models',
		'rocketchat:callbacks',
		'rocketchat:lib',
		'templating',
	]);
	api.addFiles('client/views/stylesheets/messagepin.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
