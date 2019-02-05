Package.describe({
	name: 'rocketchat:message-pin',
	version: '0.0.1',
	summary: 'Pin Messages',
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:utils',
		'templating',
	]);
	api.addFiles('client/views/stylesheets/messagepin.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
