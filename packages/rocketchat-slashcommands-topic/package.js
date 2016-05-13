Package.describe({
	name: 'rocketchat:slashcommands-topic',
	version: '0.0.1',
	summary: 'Command handler for the /topic command',
	git: ''
});

Package.onUse(function(api) {

	api.versionsFrom('1.0');

	api.use([
		'rocketchat:lib'
	]);

	api.use('ecmascript');

	api.addFiles('topic.js', ['client', 'server']);
});
