Package.describe({
	name: 'rocketchat:lib',
	version: '0.0.1',
	summary: 'RocketChat libraries',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'reactive-dict',
		'coffeescript',
		'underscore',
		'underscorestring:underscore.string'
	]);

	api.addFiles('lib/underscore.string.coffee', ['server', 'client']);
	api.addFiles('lib/core.coffee', ['server', 'client']);
	api.addFiles('lib/callbacks.coffee', ['server', 'client']);
	api.addFiles('server/sendMessage.coffee', ['server']);
	api.addFiles('server/slashCommand.coffee', ['server']);
	api.addFiles('client/slashCommand.coffee', ['client']);

	api.addFiles([
		'settings/lib/settings.coffee',
		'settings/lib/rocketchat.coffee'
	], ['server', 'client']);

	api.addFiles('settings/client/startup.coffee', ['client']);
	api.addFiles('settings/client/rocketchat.coffee', ['client']);

	api.addFiles([
		'settings/server/methods.coffee',
		'settings/server/publication.coffee',
		'settings/server/startup.coffee'
	], ['server']);

	api.addFiles('server/cdn.coffee', ['server']);

	api.export(['RocketChat'], ['server', 'client']);
});

Package.onTest(function(api) {

});
