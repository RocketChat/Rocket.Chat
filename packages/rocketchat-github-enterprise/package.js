Package.describe({
	name: 'rocketchat:github-enterprise',
	version: '0.0.1',
	summary: 'RocketChat settings for GitHub Enterprise Oauth Flow',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:custom-oauth',
		'templating',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
