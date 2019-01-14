Package.describe({
	name: 'rocketchat:notifications',
	version: '0.0.1',
	summary: 'Rocketchat Notifications',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:models',
		'rocketchat:settings',
		'rocketchat:streamer',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
