Package.describe({
	name: 'rocketchat:github-enterprise',
	version: '0.0.1',
	summary: 'RocketChat settings for GitHub Enterprise Oauth Flow',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:settings',
		'rocketchat:custom-oauth',
		'templating',
	]);
	api.addFiles('client/github-enterprise-login-button.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
