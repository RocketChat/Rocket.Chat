Package.describe({
	name: 'rocketchat:2fa',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'templating',
		'rocketchat:lib',
		'rocketchat:ui',
	]);

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
