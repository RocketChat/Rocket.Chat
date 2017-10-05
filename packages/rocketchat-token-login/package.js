Package.describe({
	name: 'rocketchat:login-token',
	summary: '',
	version: '1.0.0'
});

Package.onUse(function(api) {

	// Server libs
	api.use('rocketchat:logger', 'server');

	api.use('kadira:flow-router', 'client');

	api.use('rocketchat:lib');
	api.use('accounts-base');
	api.use('ecmascript');

	// Server files
	api.addFiles('server/login_token_server.js', 'server');

	// Client files
	api.addFiles('client/login_token_client.js', 'client');
});
