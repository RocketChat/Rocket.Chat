Package.describe({
	name: 'rocketchat:wordpress',
	version: '0.0.1',
	summary: 'RocketChat settings for WordPress Oauth Flow',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:custom-oauth',
		'templating',
	]);
	api.addFiles('client/wordpress-login-button.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
