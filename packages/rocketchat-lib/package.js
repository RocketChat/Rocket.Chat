Package.describe({
	name: 'rocketchat:lib',
	version: '0.0.1',
	summary: 'RocketChat libraries',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('rate-limit');
	api.use('reactive-var');
	api.use('reactive-dict');
	api.use('coffeescript');
	api.use('ecmascript');
	api.use('random');
	api.use('check');
	api.use('tracker');
	api.use('ddp-rate-limiter');
	api.use('underscore');
	api.use('mongo');
	api.use('underscorestring:underscore.string');
	api.use('monbro:mongodb-mapreduce-aggregation@1.0.1');
	api.use('matb33:collection-hooks');
	api.use('service-configuration');
	api.use('check');
	api.use('rocketchat:streamer');
	api.use('rocketchat:version');
	api.use('rocketchat:logger');

	api.use('templating', 'client');
	api.use('kadira:flow-router', 'client');

	api.addFiles('lib/core.coffee');

	// DEBUGGER
	api.addFiles('server/lib/debug.js', 'server');

	// COMMON LIB
	api.addFiles('lib/settings.coffee');
	api.addFiles('lib/configLogger.coffee');
	api.addFiles('lib/callbacks.coffee');
	api.addFiles('lib/fileUploadRestrictions.js');
	api.addFiles('lib/promises.coffee');
	api.addFiles('lib/slashCommand.coffee');
	api.addFiles('lib/Message.coffee');
	api.addFiles('lib/MessageTypes.coffee');

	// SERVER LIB
	api.addFiles('server/lib/defaultBlockedDomainsList.js', 'server');
	api.addFiles('server/lib/notifyUsersOnMessage.js', 'server');
	api.addFiles('server/lib/RateLimiter.coffee', 'server');
	api.addFiles('server/lib/roomTypes.coffee', 'server');
	api.addFiles('server/lib/sendEmailOnMessage.js', 'server');
	api.addFiles('server/lib/sendNotificationsOnMessage.js', 'server');
	api.addFiles('server/lib/validateEmailDomain.js', 'server');

	// SERVER MODELS
	api.addFiles('server/models/_Base.coffee', 'server');
	api.addFiles('server/models/Messages.coffee', 'server');
	api.addFiles('server/models/Reports.coffee', 'server');
	api.addFiles('server/models/Rooms.coffee', 'server');
	api.addFiles('server/models/Settings.coffee', 'server');
	api.addFiles('server/models/Subscriptions.coffee', 'server');
	api.addFiles('server/models/Uploads.coffee', 'server');
	api.addFiles('server/models/Users.coffee', 'server');

	// SERVER PUBLICATIONS
	api.addFiles('server/publications/settings.coffee', 'server');

	// SERVER FUNCTIONS
	api.addFiles('server/functions/checkUsernameAvailability.coffee', 'server');
	api.addFiles('server/functions/checkEmailAvailability.js', 'server');
	api.addFiles('server/functions/deleteUser.js', 'server');
	api.addFiles('server/functions/sendMessage.coffee', 'server');
	api.addFiles('server/functions/settings.coffee', 'server');
	api.addFiles('server/functions/setUsername.coffee', 'server');
	api.addFiles('server/functions/setEmail.js', 'server');
	api.addFiles('server/functions/Notifications.coffee', 'server');

	// SERVER METHODS
	api.addFiles('server/methods/addOAuthService.coffee', 'server');
	api.addFiles('server/methods/checkRegistrationSecretURL.coffee', 'server');
	api.addFiles('server/methods/deleteUserOwnAccount.js', 'server');
	api.addFiles('server/methods/joinDefaultChannels.coffee', 'server');
	api.addFiles('server/methods/removeOAuthService.coffee', 'server');
	api.addFiles('server/methods/robotMethods.coffee', 'server');
	api.addFiles('server/methods/saveSetting.coffee', 'server');
	api.addFiles('server/methods/sendInvitationEmail.coffee', 'server');
	api.addFiles('server/methods/sendMessage.coffee', 'server');
	api.addFiles('server/methods/sendSMTPTestEmail.coffee', 'server');
	api.addFiles('server/methods/setAdminStatus.coffee', 'server');
	api.addFiles('server/methods/setRealName.coffee', 'server');
	api.addFiles('server/methods/setUsername.coffee', 'server');
	api.addFiles('server/methods/insertOrUpdateUser.coffee', 'server');
	api.addFiles('server/methods/setEmail.js', 'server');
	api.addFiles('server/methods/restartServer.coffee', 'server');

	// SERVER STARTUP
	api.addFiles('server/startup/settingsOnLoadCdnPrefix.coffee', 'server');
	api.addFiles('server/startup/settingsOnLoadSMTP.coffee', 'server');
	api.addFiles('server/startup/oAuthServicesUpdate.coffee', 'server');
	api.addFiles('server/startup/settings.coffee', 'server');

	// COMMON STARTUP
	api.addFiles('lib/startup/settingsOnLoadSiteUrl.coffee');

	// CLIENT LIB
	api.addFiles('client/lib/openRoom.coffee', 'client');
	api.addFiles('client/lib/roomExit.coffee', 'client');
	api.addFiles('client/lib/settings.coffee', 'client');
	api.addFiles('client/lib/roomTypes.coffee', 'client');

	// CLIENT METHODS
	api.addFiles('client/methods/sendMessage.coffee', 'client');
	api.addFiles('client/AdminBox.coffee', 'client');
	api.addFiles('client/Notifications.coffee', 'client');
	api.addFiles('client/TabBar.coffee', 'client');
	api.addFiles('client/MessageAction.coffee', 'client');

	api.addFiles('client/defaultTabBars.js', 'client');

	// CLIENT MODELS
	api.addFiles('client/models/_Base.coffee', 'client');
	api.addFiles('client/models/Uploads.coffee', 'client');

	// VERSION
	api.addFiles('rocketchat.info');

	// EXPORT
	api.export('RocketChat');

	// TAPi18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-lib/i18n'), function(filename) {
		if (filename.indexOf('.json') > -1 && fs.statSync('packages/rocketchat-lib/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.addFiles(tapi18nFiles);

	api.use('tap:i18n');
	api.imply('tap:i18n');
});

Package.onTest(function(api) {
	api.use('coffeescript');
	api.use('sanjo:jasmine@0.20.2');
	api.use('rocketchat:lib');
	api.addFiles('tests/jasmine/server/unit/models/_Base.spec.coffee', 'server');
});
