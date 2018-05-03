Package.describe({
	name: 'rocketchat:slashcommands-join',
	version: '0.0.1',
	summary: 'Command handler for the /join command',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles('client/client.js', 'client');
	api.addFiles('server/server.js', 'server');
});
