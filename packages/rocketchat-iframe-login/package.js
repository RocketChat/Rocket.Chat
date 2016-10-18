Package.describe({
	name: 'rocketchat:iframe-login',
	summary: '',
	version: '1.0.0'
});

Package.onUse(function(api) {

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
	api.use('check');

	api.imply('facebook');
	api.imply('twitter');
	api.imply('google');
	api.imply('oauth');

	// Server files
	api.addFiles('iframe_rocketchat.js', 'server');
	api.addFiles('iframe_server.js', 'server');

	// Client files
	api.addFiles('iframe_client.js', 'client');
});
