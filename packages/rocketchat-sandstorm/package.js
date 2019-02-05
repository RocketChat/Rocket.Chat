Package.describe({
	name: 'rocketchat:sandstorm',
	version: '0.0.1',
	summary: 'Sandstorm integeration for Rocket.Chat',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'jalik:ufs',
		'kadira:flow-router',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
