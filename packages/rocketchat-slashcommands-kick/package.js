Package.describe({
	name: 'rocketchat:slashcommands-kick',
	version: '0.0.1',
	summary: 'Command handler for the /kick command',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'coffeescript',
		'check',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles('client.coffee', 'client');
	api.addFiles('server.coffee', 'server');
});
