Package.describe({
	name: 'rocketchat:slashcommands-github',
	version: '0.0.1',
	summary: 'Command handler for the /github command',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles('github.js', ['server', 'client']);
});
