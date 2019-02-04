Package.describe({
	name: 'rocketchat:callbacks',
	summary: 'Rocketchat Callbacks',
	version: '0.0.1',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
