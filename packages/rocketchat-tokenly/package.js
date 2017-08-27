Package.describe({
	name: 'rocketchat:tokenly',
	version: '0.0.1',
	summary: 'RocketChat settings for Tokenly OAuth flow'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('service-configuration');
	api.use('rocketchat:lib@0.0.1');
	api.use('rocketchat:custom-oauth');

	api.addFiles('common.js');
	api.addFiles('login-button.css', 'client');
	api.addFiles('startup.js', 'server');

	api.use('templating', 'client');
});

