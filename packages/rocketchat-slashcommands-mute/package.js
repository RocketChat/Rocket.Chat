Package.describe({
	name: 'rocketchat:slashcommands-mute',
	version: '0.0.1',
	summary: 'Command handler for the /mute command',
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

	api.addFiles('client/mute.coffee', 'client');
	api.addFiles('client/unmute.coffee', 'client');
	api.addFiles('server/mute.coffee', 'server');
	api.addFiles('server/unmute.coffee', 'server');
});
