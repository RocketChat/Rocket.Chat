Package.describe({
	name: 'rocketchat:hubot',
	version: '0.0.1',
	summary: 'Package hubot for Meteor server',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use(['coffeescript']);

	api.addFiles('hubot.coffee', ['server']);

	api.export('Hubot', ['server']);
});

Npm.depends({
	"coffee-script": "1.9.3",
	"hubot": "2.13.1"
});

Package.onTest(function(api) {});
