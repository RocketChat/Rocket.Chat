Package.describe({
	name: 'rocketchat:slashcommands-invite-all',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /invite-all commands',
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
