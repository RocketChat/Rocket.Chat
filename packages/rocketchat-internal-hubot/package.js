Package.describe({
	name: 'rocketchat:internal-hubot',
	version: '0.0.1',
	summary: 'Internal Hubot for Rocket.Chat',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'coffeescript',
		'tracker',
		'rocketchat:lib'
	]);
	api.use('underscorestring:underscore.string');

	api.use('templating', 'client');

	api.addFiles([
		'hubot.coffee',
		'settings.coffee'
	], ['server']);

	api.export('Hubot', ['server']);
	api.export('HubotScripts', ['server']);
	api.export('InternalHubot', ['server']);
	api.export('InternalHubotReceiver', ['server']);
	api.export('RocketChatAdapter', ['server']);

});

Npm.depends({
	'coffee-script': '1.10.0',
	'hubot': '2.19.0',
	'hubot-scripts': '2.17.1',
	'hubot-help': '0.2.0'
});
