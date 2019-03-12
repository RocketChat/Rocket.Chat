Package.describe({
	name: 'rocketchat:slashcommands-asciiarts',
	version: '0.0.1',
	summary: 'Message pre-processor that will add ascii arts to messages',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:utils',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
