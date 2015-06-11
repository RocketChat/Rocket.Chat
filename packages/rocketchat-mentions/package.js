Package.describe({
	name: 'rocketchat:mentions',
	version: '0.0.1',
	summary: 'Message pre-processor that will process mentions',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('server.coffee', 'server');
	api.addFiles('client.coffee', 'client');
});

Package.onTest(function(api) {

});
