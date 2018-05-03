Package.describe({
	name: 'rocketchat:drupal',
	version: '0.0.1',
	summary: 'RocketChat settings for Drupal oAuth2'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use('ecmascript');
	api.use('service-configuration');
	api.use('rocketchat:lib@0.0.1');
	api.use('rocketchat:custom-oauth');

	// api.use('templating', 'client');

	api.addFiles('common.js');
	api.addFiles('login-button.css', 'client');
	api.addFiles('startup.js', 'server');

	api.use('templating', 'client');
});

