Package.describe({
	name: 'rocketchat:slashcommands-topic',
	version: '0.0.1',
	summary: 'Command handler for the /topic command',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'rocketchat:lib',
		'ecmascript',
		'rocketchat:authorization',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
