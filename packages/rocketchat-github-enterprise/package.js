Package.describe({
	name: 'rocketchat:github-enterprise',
	version: '0.0.1',
	summary: 'RocketChat settings for GitHub Enterprise Oauth Flow'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('rocketchat:custom-oauth');

	api.use('templating', 'client');

	api.addFiles('common.js');
	api.addFiles('github-enterprise-login-button.css', 'client');
	api.addFiles('startup.js', 'server');
});
