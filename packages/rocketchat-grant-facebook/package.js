Package.describe({
	name: 'rocketchat:grant-facebook',
	version: '0.0.1',
	summary: 'Provides Facebook to rocketchat:grant',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'http',
		'rocketchat:grant'
	]);

	api.mainModule('server/index.js', 'server');
});
