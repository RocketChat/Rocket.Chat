Package.describe({
	name: 'rocketchat:lib',
	version: '0.0.1',
	summary: 'RocketChat libraries',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('reactive-var');
	api.use('reactive-dict');
	api.use('coffeescript');
	api.use('random');
	api.use('check');
	api.use('ddp-rate-limiter');
	api.use('underscore');
	api.use('underscorestring:underscore.string');
	api.use('monbro:mongodb-mapreduce-aggregation@1.0.1');

	// COMMON
	api.addFiles('lib/core.coffee');
	api.addFiles('lib/callbacks.coffee');
	api.addFiles('lib/slashCommand.coffee');

	// MODELS SERVER
	api.addFiles('server/models/_Base.coffee', 'server');
	api.addFiles('server/models/Users.coffee', 'server');
	api.addFiles('server/models/Subscriptions.coffee', 'server');
	api.addFiles('server/models/Rooms.coffee', 'server');
	api.addFiles('server/models/Messages.coffee', 'server');
	api.addFiles('server/models/Reports.coffee', 'server');

	// Settings
	api.addFiles('settings/lib/rocketchat.coffee');
	api.addFiles('settings/lib/onLoadSettings.coffee');

	api.addFiles('settings/server/models/Settings.coffee', 'server');
	api.addFiles('settings/server/methods.coffee', 'server');
	api.addFiles('settings/server/publication.coffee', 'server');
	api.addFiles('settings/server/startup.coffee', 'server');
	api.addFiles('settings/server/updateServices.coffee', 'server');
	api.addFiles('settings/server/addOAuthService.coffee', 'server');

	api.addFiles('settings/lib/settings.coffee');

	// CLIENT
	api.addFiles('client/Notifications.coffee', 'client');
	api.addFiles('client/TabBar.coffee', 'client');
	api.addFiles('client/MessageAction.coffee', 'client');

	api.addFiles('settings/client/rocketchat.coffee', 'client');

	// SERVER
	api.addFiles('server/functions/checkUsernameAvailability.coffee', 'server');
	api.addFiles('server/functions/setUsername.coffee', 'server');

	api.addFiles('server/methods/joinDefaultChannels.coffee', 'server');
	api.addFiles('server/methods/sendInvitationEmail.coffee', 'server');
	api.addFiles('server/methods/setAdminStatus.coffee', 'server');
	api.addFiles('server/methods/setUsername.coffee', 'server');
	api.addFiles('server/methods/updateUser.coffee', 'server');

	api.addFiles('server/sendMessage.coffee', 'server');

	api.addFiles('server/Notifications.coffee', 'server');

	api.addFiles('server/cdn.coffee', 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-lib/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-lib/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n@1.6.1', ['client', 'server']);
	api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);

	// EXPORT
	api.export('RocketChat');
});

Package.onTest(function(api) {

});
