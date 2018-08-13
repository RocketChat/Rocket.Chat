Package.describe({
	name: 'rocketchat:grant-wechat',
	version: '0.0.1',
	summary: 'Provides Wechat to rocketchat:grant',
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
