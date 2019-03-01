Package.describe({
	name: 'rocketchat:custom-oauth',
	summary: 'Custom OAuth flow',
	version: '1.0.0',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'check',
		'oauth',
		'oauth2',
		'accounts-oauth',
		'service-configuration',
		'rocketchat:logger',
		'rocketchat:models',
		'templating',
		'http',
	]);
	api.mainModule('client/custom_oauth_client.js', 'client');
	api.mainModule('server/custom_oauth_server.js', 'server');

	api.export('CustomOAuth');
});
