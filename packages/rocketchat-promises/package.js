Package.describe({
	name: 'rocketchat:promises',
	version: '0.0.1',
	summary: 'Rocketchat Promises',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
