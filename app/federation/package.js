Package.describe({
	name: 'rocketchat:federation',
	version: '0.0.1',
	summary: 'RocketChat support for federating with other RocketChat servers',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:api',
		'rocketchat:cloud',
		'rocketchat:lib',
		'rocketchat:reactions',
		'rocketchat:models',
		'rocketchat:settings',
	]);

	api.use('accounts-base', 'server');
	api.use('accounts-password', 'server');

	api.mainModule('client/main.js', 'client');
	api.mainModule('server/main.js', 'server');
});
