Package.describe({
	name: 'rocketchat:models',
	summary: 'RocketChat Models',
	version: '1.0.0',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:callbacks',
		'rocketchat:ui-cached-collection',
		'konecty:multiple-instances-status',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
