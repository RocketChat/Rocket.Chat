Package.describe({
	name: 'rocketchat:slashcommands-hide',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /hide commands',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:utils',
		'rocketchat:models',
		'rocketchat:notifications',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
