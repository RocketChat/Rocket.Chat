Package.describe({
	name: 'rocketchat:slashcommands-open',
	version: '0.0.1',
	summary: 'Command handler for the /open command',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib',
		'kadira:flow-router'
	]);

	api.use('templating', 'client');

	api.addFiles('client/client.js', 'client');
});
