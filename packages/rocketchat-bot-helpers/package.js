Package.describe({
	name: 'rocketchat:bot-helpers',
	version: '0.0.1',
	summary: 'Add some helper methods to Rocket.Chat for bots to use.',
	git: 'https://github.com/timkinnane/rocketchat-bot-helpers',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'accounts-base',
	]);
	api.mainModule('server/index.js', 'server');
});
