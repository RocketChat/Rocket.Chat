Package.describe({
	name: 'rocketchat:metrics',
	version: '0.0.1',
	summary: 'Rocketchat Metrics',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:callbacks',
		'rocketchat:migrations',
		'rocketchat:models',
		'rocketchat:settings',
		'rocketchat:utils',
		'rocketchat:version',
	]);
	api.mainModule('server/index.js', 'server');
});
