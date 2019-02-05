Package.describe({
	name: 'rocketchat:2fa',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'accounts-base',
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'sha',
		'random',
		'rocketchat:ui',
		'rocketchat:utils',
	]);

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
