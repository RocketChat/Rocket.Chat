Package.describe({
	summary: 'Tokenly OAuth flow',
	version: '0.0.1'
});

Package.onUse(function(api) {
	api.use('oauth2', ['client', 'server']);
	api.use('oauth', ['client', 'server']);
	api.use('http', ['server']);
	api.use('underscore', 'server');
	api.use('random', 'client');
	api.use('service-configuration', ['client', 'server']);

	api.addFiles('tokenly_client.js', 'client');
	api.addFiles('tokenly_server.js', 'server');

	api.export('Tokenly');
});
