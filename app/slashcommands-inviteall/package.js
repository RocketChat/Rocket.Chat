Package.describe({
	name: 'rocketchat:slashcommands-invite-all',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate /invite-all commands',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'check',
		'rocketchat:utils',
		'rocketchat:models',
		'rocketchat:notifications',
		'rocketchat:settings',
		'templating',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
