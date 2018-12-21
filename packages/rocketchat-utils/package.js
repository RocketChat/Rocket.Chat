Package.describe({
	name: 'rocketchat:utils',
	version: '0.0.1',
	summary: 'RocketChat utils',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'tap:i18n',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
