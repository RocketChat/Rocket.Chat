Package.describe({
	name: 'rocketchat:slashcommands-archive',
	version: '0.0.1',
	summary: 'Command handler for the /room command',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles(['messages.js', 'server.js'], 'server');
});
