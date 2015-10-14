Package.describe({
	name: 'rocketchat:bot-commands',
	version: '0.0.1',
	summary: 'Bot command hook and autocomplete',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('main.coffee');
	api.addFiles('server/methods/addBotCommands.coffee');
	api.addFiles('server/methods/listBotCommands.coffee', 'server');
});

Package.onTest(function(api) {

});
