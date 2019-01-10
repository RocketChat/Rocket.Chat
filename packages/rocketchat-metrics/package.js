Package.describe({
	name: 'rocketchat:metrics',
	version: '0.0.1',
	summary: 'Rocketchat Metrics',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:settings',
		'rocketchat:models',
		'rocketchat:version',
	]);
	api.mainModule('server/index.js', 'server');
});
