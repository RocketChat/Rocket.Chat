Package.describe({
	name: 'rocketchat:slashcommands-mute',
	version: '0.0.1',
	summary: 'Command handler for the /mute command',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib',
	]);
	api.mainModule('server/index.js', 'server');
});
