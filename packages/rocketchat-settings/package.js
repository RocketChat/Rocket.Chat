Package.describe({
	name: 'rocketchat:settings',
	version: '0.0.1',
	summary: '',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:ui-cached-collection',
		'rocketchat:models',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
