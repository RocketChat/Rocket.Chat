Package.describe({
	name: 'rocketchat:lib',
	version: '0.0.1',
	summary: 'RocketChat libraries',
	git: ''
});

Npm.depends({
	'bad-words': '1.3.1',
	'node-dogstatsd': '0.0.6',
	'localforage': '1.4.2',
	'bugsnag': '1.8.0'
});

Package.onUse(function(api) {
	api.use('rate-limit');
	api.use('session');
	api.use('reactive-var');
	api.use('reactive-dict');
	api.use('accounts-base');
	api.use('coffeescript');
	api.use('ecmascript');
	api.use('random');
	api.use('check');
	api.use('tracker');
	api.use('ddp-rate-limiter');
	api.use('underscore');
	api.use('mongo');
	api.use('underscorestring:underscore.string');
	api.use('matb33:collection-hooks');
	api.use('service-configuration');
	api.use('check');
	api.use('momentjs:moment');
	api.use('rocketchat:i18n');
	api.use('rocketchat:streamer');
	api.use('rocketchat:version');
	api.use('rocketchat:logger');
	api.use('rocketchat:custom-oauth');

	api.use('templating', 'client');
	api.use('kadira:flow-router');

	api.addFiles('lib/core.coffee');

	// DEBUGGER
	api.addFiles('server/lib/debug.js', 'server');

	// COMMON LIB
	api.addFiles('lib/settings.coffee');
	api.addFiles('lib/configLogger.coffee');
	api.addFiles('lib/callbacks.coffee');
	api.addFiles('lib/fileUploadRestrictions.js');
	api.addFiles('lib/placeholders.js');
	api.addFiles('lib/promises.coffee');
	api.addFiles('lib/roomTypesCommon.coffee');
	api.addFiles('lib/slashCommand.coffee');
	api.addFiles('lib/Message.coffee');
	api.addFiles('lib/MessageTypes.coffee');

	api.addFiles('server/lib/bugsnag.js', 'server');

	api.addFiles('server/lib/RateLimiter.coffee', 'server');

	// SERVER FUNCTIONS
	api.addFiles('server/functions/addUserToDefaultChannels.js', 'server');
	api.addFiles('server/functions/addUserToRoom.js', 'server');
	api.addFiles('server/functions/archiveRoom.js', 'server');
	api.addFiles('server/functions/checkUsernameAvailability.coffee', 'server');
	api.addFiles('server/functions/checkEmailAvailability.js', 'server');
	api.addFiles('server/functions/createRoom.js', 'server');
	api.addFiles('server/functions/deleteMessage.js', 'server');
	api.addFiles('server/functions/deleteUser.js', 'server');
	api.addFiles('server/functions/removeUserFromRoom.js', 'server');
	api.addFiles('server/functions/saveUser.js', 'server');
	api.addFiles('server/functions/saveCustomFields.js', 'server');
	api.addFiles('server/functions/sendMessage.coffee', 'server');
	api.addFiles('server/functions/settings.coffee', 'server');
	api.addFiles('server/functions/setUserAvatar.js', 'server');
	api.addFiles('server/functions/setUsername.coffee', 'server');
	api.addFiles('server/functions/setEmail.js', 'server');
	api.addFiles('server/functions/unarchiveRoom.js', 'server');
	api.addFiles('server/functions/updateMessage.js', 'server');
	api.addFiles('server/functions/Notifications.coffee', 'server');

	// SERVER LIB
	api.addFiles('server/lib/defaultBlockedDomainsList.js', 'server');
	api.addFiles('server/lib/notifyUsersOnMessage.js', 'server');
	api.addFiles('server/lib/roomTypes.coffee', 'server');
	api.addFiles('server/lib/sendEmailOnMessage.js', 'server');
	api.addFiles('server/lib/sendNotificationsOnMessage.js', 'server');
	api.addFiles('server/lib/validateEmailDomain.js', 'server');

	// SERVER MODELS
	api.addFiles('server/models/_Base.js', 'server');
	api.addFiles('server/models/Messages.coffee', 'server');
	api.addFiles('server/models/Reports.coffee', 'server');
	api.addFiles('server/models/Rooms.coffee', 'server');
	api.addFiles('server/models/Settings.coffee', 'server');
	api.addFiles('server/models/Subscriptions.coffee', 'server');
	api.addFiles('server/models/Uploads.coffee', 'server');
	api.addFiles('server/models/Users.coffee', 'server');

	api.addFiles('server/startup/statsTracker.js', 'server');

	// SERVER PUBLICATIONS
	api.addFiles('server/publications/settings.coffee', 'server');

	// SERVER METHODS
	api.addFiles('server/methods/addOAuthService.coffee', 'server');
	api.addFiles('server/methods/addUserToRoom.coffee', 'server');
	api.addFiles('server/methods/archiveRoom.coffee', 'server');
	api.addFiles('server/methods/checkRegistrationSecretURL.coffee', 'server');
	api.addFiles('server/methods/createChannel.coffee', 'server');
	api.addFiles('server/methods/createPrivateGroup.coffee', 'server');
	api.addFiles('server/methods/deleteMessage.coffee', 'server');
	api.addFiles('server/methods/deleteUserOwnAccount.js', 'server');
	api.addFiles('server/methods/getRoomRoles.js', 'server');
	api.addFiles('server/methods/getUserRoles.js', 'server');
	api.addFiles('server/methods/joinRoom.coffee', 'server');
	api.addFiles('server/methods/joinDefaultChannels.coffee', 'server');
	api.addFiles('server/methods/leaveRoom.coffee', 'server');
	api.addFiles('server/methods/removeOAuthService.coffee', 'server');
	api.addFiles('server/methods/robotMethods.coffee', 'server');
	api.addFiles('server/methods/saveSetting.js', 'server');
	api.addFiles('server/methods/sendInvitationEmail.coffee', 'server');
	api.addFiles('server/methods/sendMessage.coffee', 'server');
	api.addFiles('server/methods/sendSMTPTestEmail.coffee', 'server');
	api.addFiles('server/methods/setAdminStatus.coffee', 'server');
	api.addFiles('server/methods/setRealName.coffee', 'server');
	api.addFiles('server/methods/setUsername.coffee', 'server');
	api.addFiles('server/methods/insertOrUpdateUser.coffee', 'server');
	api.addFiles('server/methods/setEmail.js', 'server');
	api.addFiles('server/methods/restartServer.coffee', 'server');
	api.addFiles('server/methods/unarchiveRoom.coffee', 'server');
	api.addFiles('server/methods/updateMessage.coffee', 'server');
	api.addFiles('server/methods/filterBadWords.js', ['server']);
	api.addFiles('server/methods/filterATAllTag.js', 'server');

	// SERVER STARTUP
	api.addFiles('server/startup/settingsOnLoadCdnPrefix.coffee', 'server');
	api.addFiles('server/startup/settingsOnLoadSMTP.coffee', 'server');
	api.addFiles('server/startup/oAuthServicesUpdate.coffee', 'server');
	api.addFiles('server/startup/settings.coffee', 'server');

	// COMMON STARTUP
	api.addFiles('lib/startup/settingsOnLoadSiteUrl.coffee');

	// CLIENT LIB
	api.addFiles('client/Notifications.coffee', 'client');
	api.addFiles('client/lib/cachedCollection.js', 'client');
	api.addFiles('client/lib/openRoom.coffee', 'client');
	api.addFiles('client/lib/roomExit.coffee', 'client');
	api.addFiles('client/lib/settings.coffee', 'client');
	api.addFiles('client/lib/roomTypes.coffee', 'client');
	api.addFiles('client/lib/userRoles.js', 'client');
	api.addFiles('client/lib/Layout.js', 'client');

	// CLIENT METHODS
	api.addFiles('client/methods/sendMessage.coffee', 'client');
	api.addFiles('client/AdminBox.coffee', 'client');
	api.addFiles('client/TabBar.coffee', 'client');
	api.addFiles('client/MessageAction.coffee', 'client');

	api.addFiles('client/defaultTabBars.js', 'client');
	api.addFiles('client/CustomTranslations.js', 'client');

	// CLIENT MODELS
	api.addFiles('client/models/_Base.coffee', 'client');
	api.addFiles('client/models/Uploads.coffee', 'client');

	api.addFiles('startup/defaultRoomTypes.coffee');

	// VERSION
	api.addFiles('rocketchat.info');

	// EXPORT
	api.export('RocketChat');

	api.imply('tap:i18n');
});

Package.onTest(function(api) {
	api.use('coffeescript');
	api.use('sanjo:jasmine@0.20.2');
	api.use('rocketchat:lib');
	api.addFiles('tests/jasmine/server/unit/models/_Base.spec.coffee', 'server');
});
