Package.describe({
	name: 'rocketchat:models',
	summary: 'RocketChat Models',
	version: '1.0.0',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:settings',
		'rocketchat:utils',
		'rocketchat:callbacks',
		'konecty:multiple-instances-status',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
