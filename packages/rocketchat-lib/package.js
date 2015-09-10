Package.describe({
	name: 'rocketchat:lib',
	version: '0.0.1',
	summary: 'RocketChat libraries',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('reactive-dict');
	api.use('coffeescript');
	api.use('random');
	api.use('underscore');
	api.use('underscorestring:underscore.string');


	// COMMON
	api.addFiles('lib/core.coffee');
	api.addFiles('lib/callbacks.coffee');
	api.addFiles('lib/slashCommand.coffee');

	api.addFiles('settings/lib/settings.coffee');
	api.addFiles('settings/lib/rocketchat.coffee');


	// CLIENT
	api.addFiles('client/Notifications.coffee', 'client');

	api.addFiles('settings/client/startup.coffee', 'client');
	api.addFiles('settings/client/rocketchat.coffee', 'client');


	// SERVER
	api.addFiles('server/functions/checkUsernameAvailability.coffee', 'server');
	api.addFiles('server/functions/setUsername.coffee', 'server');

	api.addFiles('server/methods/joinDefaultChannels.coffee', 'server');
	api.addFiles('server/methods/setAdminStatus.coffee', 'server');
	api.addFiles('server/methods/setUsername.coffee', 'server');
	api.addFiles('server/methods/updateUser.coffee', 'server');

	api.addFiles('server/sendMessage.coffee', 'server');

	api.addFiles('server/Notifications.coffee', 'server');

	api.addFiles('settings/server/methods.coffee', 'server');
	api.addFiles('settings/server/publication.coffee', 'server');
	api.addFiles('settings/server/startup.coffee', 'server');
	api.addFiles('settings/server/updateServices.coffee', 'server');
	api.addFiles('settings/server/addOAuthService.coffee', 'server');

	api.addFiles('server/cdn.coffee', 'server');


	// EXPORT
	api.export('RocketChat');
});

Package.onTest(function(api) {

});
