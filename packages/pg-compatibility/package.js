Package.describe({
	name: 'pg-compatibilty',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'simple:pg'
	]);

	api.addFiles('server.coffee', 'server');
	api.addFiles('client.coffee', 'client');
});

Package.onTest(function(api) {

});
