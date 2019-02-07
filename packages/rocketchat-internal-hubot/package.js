Package.describe({
	name: 'rocketchat:internal-hubot',
	version: '0.0.1',
	summary: 'Internal Hubot for Rocket.Chat',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'tracker',
		'rocketchat:lib',
		'templating',
	]);
	api.mainModule('server/index.js', 'server');
});

// It needs to be here cuz they are coffee files and need to be compiled
Npm.depends({
	hubot: '2.19.0',
	'hubot-help': '0.2.2',
});
