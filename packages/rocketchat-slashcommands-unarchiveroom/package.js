Package.describe({
	name: 'rocketchat:slashcommands-unarchive',
	version: '0.0.1',
	summary: 'Command handler for the /unarchive command',
	git: ''
});

Package.onUse(function(api) {

	api.versionsFrom('1.0');

	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles('client.js', 'client');
	api.addFiles('messages.js', 'server');
	api.addFiles('server.js', 'server');
});
