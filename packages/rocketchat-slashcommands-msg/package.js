Package.describe({
	name: 'rocketchat:slashcommands-msg',
	version: '0.0.1',
	summary: 'Command handler for the /msg command',
	git: ''
});

Package.onUse(function(api) {

	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'check',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles('client.coffee', 'client');
	api.addFiles('server.coffee', 'server');
});
