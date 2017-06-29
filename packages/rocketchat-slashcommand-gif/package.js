Package.describe({
	name: 'rocketchat:slashcommands-gif',
	version: '0.0.1',
	summary: 'Show gif from rightgif',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'rocketchat:lib'
	]);

	api.use('ecmascript');

	api.addFiles('gif-server.js', ['server']);
	api.addFiles('gif-client.js', ['client']);
});
