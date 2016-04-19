Package.describe({
	name: 'rocketchat:iframe-login',
	summary: '',
	version: '1.0.0'
});

Package.onUse(function(api) {

	api.versionsFrom('1.0');

	// Server libs
	api.use('rocketchat:logger', 'server');

	api.use('kadira:flow-router', 'client');

	api.use('rocketchat:lib');
	api.use('accounts-base');
	api.use('underscore');
	api.use('ecmascript');
	api.use('reactive-var');
	api.use('http');
	api.use('tracker');

	// Server files
	api.addFiles('iframe_rocketchat.js', 'server');
	api.addFiles('iframe_server.js', 'server');

	// Client files
	api.addFiles('iframe_client.js', 'client');
});
