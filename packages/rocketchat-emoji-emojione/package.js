Package.describe({
	name: 'rocketchat:emoji-emojione',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate emojis',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'emojione:emojione@2.2.6',
		'rocketchat:emoji',
		'rocketchat:callbacks',
		'rocketchat:utils',
	]);
	api.addFiles('client/sprites.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
