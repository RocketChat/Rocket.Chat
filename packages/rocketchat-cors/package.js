Package.describe({
	name: 'rocketchat:cors',
	version: '0.0.1',
	summary: 'Enable CORS',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'webapp',
		'mongo',
		'rocketchat:lib',
		'rocketchat:settings',
	]);

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
