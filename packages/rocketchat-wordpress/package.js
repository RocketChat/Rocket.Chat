Package.describe({
	name: 'rocketchat:wordpress',
	version: '0.0.1',
	summary: 'RocketChat settings for WordPress Oauth Flow'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('rocketchat:custom-oauth');

	api.use('templating', 'client');

	api.addFiles('common.js');
	api.addFiles('client/wordpress-login-button.css', 'client');
	api.addFiles('startup.js', 'server');
});
