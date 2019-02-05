Package.describe({
	name: 'rocketchat:cloud',
	version: '0.0.1',
	summary: 'Package which interacts with the Rocket.Chat Cloud offerings.',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'templating',
	]);

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
