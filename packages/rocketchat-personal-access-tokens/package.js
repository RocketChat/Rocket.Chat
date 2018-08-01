Package.describe({
	name: 'rocketchat:personal-access-tokens',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'mongo'
	]);

	api.addFiles([
		'client/personalAccessTokens.html',
		'client/personalAccessTokens.js'
	], 'client');

	api.addFiles([
		'server/startup/settings.js',
		'server/publications/personalAccessTokens.js',
		'server/models/Users.js',
		'server/methods/generateToken.js',
		'server/methods/removeToken.js',
		'server/methods/regenerateToken.js'
	], 'server');
});
