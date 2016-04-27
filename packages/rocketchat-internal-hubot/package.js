Package.describe({
	name: 'rocketchat:internal-hubot',
	version: '0.0.1',
	summary: 'Internal Hubot for Rocket.Chat',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

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
	'coffee-script': '1.9.3',
	'hubot': '2.13.1',
	'hubot-calculator': '0.4.0',
	'hubot-google-hangouts': '0.7.1',
	'hubot-google-images': '0.1.5',
	'hubot-google-translate': '0.2.0',
	'hubot-maps': '0.0.2',
	'hubot-help': '0.1.1',
	'hubot-scripts': '2.16.1',
	'hubot-youtube': '1.0.0'
});
