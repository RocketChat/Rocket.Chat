Package.describe({
	name: 'rocketchat:grant',
	version: '0.0.1',
	summary: 'OAuth2',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'webapp',
		'mongo',
		'check',
		'ecmascript',
		'rocketchat:utils',
		'rocketchat:accounts',
		'rocketchat:models',
	]);

	api.mainModule('server/index.js', 'server');
});
