Package.describe({
	name: 'rocketchat:mentions',
	version: '0.0.1',
	summary: 'Message pre-processor that will process mentions',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'coffeescript',
		'rocketchat:lib'
	]);

	api.addFiles('server.coffee', 'server');
	api.addFiles('client.coffee', 'client');
});
