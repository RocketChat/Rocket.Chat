Package.describe({
	name: 'rocketchat:slashcommands-archive',
	version: '0.0.1',
	summary: 'Command handler for the /room command',
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
