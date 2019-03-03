Package.describe({
	name: 'rocketchat:cloud',
	version: '0.0.1',
	summary: 'Package which interacts with the Rocket.Chat Cloud offerings.',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:authorization',
		'rocketchat:models',
		'rocketchat:utils',
		'rocketchat:ui-utils',
		'rocketchat:settings',
		'templating',
		'kadira:flow-router',
		'kadira:blaze-layout',
	]);

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
