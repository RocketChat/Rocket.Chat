Package.describe({
	name: 'rocketchat:hubot',
	version: '0.0.1',
	summary: 'Package hubot for Meteor server',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('hubot.coffee', ['server']);

	api.export('Hubot', ['server']);
	api.export('HubotScripts', ['server']);
	api.export('RocketBot', ['server']);
	api.export('RocketBotReceiver', ['server']);
	api.export('RocketChatAdapter', ['server']);

});

Npm.depends({
	"coffee-script": "1.9.3",
	"codex-blackboard-hubot-scripts": "https://github.com/cscott/codex-blackboard-hubot-scripts/tarball/f57c178a2faee9b36d07a7905c29093b9824e0b0",
	"hubot": "2.13.1"
});

Package.onTest(function(api) {});
