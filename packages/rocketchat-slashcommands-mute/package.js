Package.describe({
	name: 'rocketchat:slashcommands-mute',
	version: '0.0.1',
	summary: 'Command handler for the /mute command',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles('client/mute.js', 'client');
	api.addFiles('client/unmute.js', 'client');
	api.addFiles('server/mute.js', 'server');
	api.addFiles('server/unmute.js', 'server');
});
