Package.describe({
	name: 'rocketchat:slashcommands-unarchive',
	version: '0.0.1',
	summary: 'Command handler for the /unarchive command',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib',
		'templating',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
