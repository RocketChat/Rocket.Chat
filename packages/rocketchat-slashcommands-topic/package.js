Package.describe({
	name: 'rocketchat:slashcommands-topic',
	version: '0.0.1',
	summary: 'Command handler for the /topic command',
	git: ''
});

Package.onUse(function(api) {

	api.versionsFrom('1.0');

	api.use([
		'rocketchat:lib',
		'ecmascript'
	]);

	api.use(['rocketchat:authorization'], ['client', 'server']);

	api.addFiles('topic.js', ['client', 'server']);
});
