Package.describe({
	name: 'rocketchat:custom-oauth',
	summary: 'Custom OAuth flow',
	version: '1.0.0'
});

Package.onUse(function(api) {
	api.use('check');
	api.use('oauth');
	api.use('oauth2');
	api.use('underscore');
	api.use('coffeescript');
	api.use('accounts-oauth');
	api.use('service-configuration');
	api.use('underscorestring:underscore.string');

	api.use('templating', 'client');

	api.use('http', 'server');


	api.addFiles('custom_oauth_client.coffee', 'client');

	api.addFiles('custom_oauth_server.coffee', 'server');

	api.export('CustomOAuth');
});
