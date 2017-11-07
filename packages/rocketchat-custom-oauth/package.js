Package.describe({
	name: 'rocketchat:custom-oauth',
	summary: 'Custom OAuth flow',
	version: '1.0.0'
});

Package.onUse(function(api) {
	api.use('modules');
	api.use('check');
	api.use('oauth');
	api.use('oauth2');
	api.use('ecmascript');
	api.use('accounts-oauth');
	api.use('service-configuration');

	api.use('templating', 'client');

	api.use('http', 'server');


	api.mainModule('client/custom_oauth_client.js', 'client');

	api.mainModule('server/custom_oauth_server.js', 'server');

	api.export('CustomOAuth');
});
