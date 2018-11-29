Package.describe({
	name: 'rocketchat:oauth2-server-config',
	summary: 'Configure the OAuth2 Server',
	version: '1.0.0',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'webapp',
		'mongo',
		'rocketchat:lib',
		'rocketchat:api',
		'rocketchat:theme',
		'rocketchat:oauth2-server',
		'templating',
		'kadira:flow-router',
		'kadira:blaze-layout',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
