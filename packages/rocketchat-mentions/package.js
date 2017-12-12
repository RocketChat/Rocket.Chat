Package.describe({
	name: 'rocketchat:mentions',
	version: '0.0.1',
	summary: 'Message pre-processor that will process mentions',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib'
	]);

	api.addFiles('server/server.js', 'server');
	api.addFiles('client/client.js', 'client');
});
