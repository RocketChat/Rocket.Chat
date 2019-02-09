Package.describe({
	name: 'rocketchat:lib',
	version: '0.0.1',
	summary: 'RocketChat libraries',
	git: '',
});

Package.onUse(function(api) {
	api.use('rate-limit');
	api.use('webapp');
	api.use('session');
	api.use('reactive-var');
	api.use('reactive-dict');
	api.use('accounts-base');
	api.use('ecmascript');
	api.use('random');
	api.use('google-oauth');
	api.use('check');
	api.use('tracker');
	api.use('jparker:gravatar');
	api.use('ddp-rate-limiter');
	api.use('mongo');
	api.use('oauth');
	api.use('matb33:collection-hooks');
	api.use('service-configuration');
	api.use('check');
	api.use('rocketchat:utils');
	api.use('rocketchat:models');
	api.use('rocketchat:migrations');
	api.use('rocketchat:metrics');
	api.use('rocketchat:callbacks');
	api.use('rocketchat:notifications');
	api.use('rocketchat:promises');
	api.use('rocketchat:ui-utils');
	api.use('rocketchat:tooltip');
	api.use('rocketchat:emoji');
	api.use('rocketchat:ui');
	api.use('rocketchat:accounts');
	api.use('rocketchat:ui');
	api.use('modules');
	api.use('rocketchat:i18n');
	api.use('rocketchat:streamer');
	api.use('rocketchat:version');
	api.use('rocketchat:logger');
	api.use('rocketchat:mailer');
	api.use('rocketchat:settings');
	api.use('rocketchat:authorization');
	api.use('mizzao:timesync');
	api.use('rocketchat:custom-oauth');
	api.use('konecty:multiple-instances-status');
	api.use('rocketchat:file');
	api.use('rocketchat:file-upload');
	api.use('rocketchat:push');
	api.use('rocketchat:push-notifications', { unordered: true });

	api.use('templating', 'client');
	api.use('kadira:flow-router');
	api.use('kadira:blaze-layout', 'client');

	api.addFiles('lib/core.js');

	api.addFiles('lib/settings.js');

	// DEBUGGER
	api.addFiles('server/lib/debug.js', 'server');

	// ROOM TYPES
	api.addFiles('lib/RoomTypeConfig.js');
	api.addFiles([
		'lib/roomTypes/conversation.js',
		'lib/roomTypes/direct.js',
		'lib/roomTypes/favorite.js',
		'lib/roomTypes/index.js',
		'lib/roomTypes/private.js',
		'lib/roomTypes/public.js',
		'lib/roomTypes/unread.js',
	]);

	// COMMON LIB
	api.addFiles('lib/getURL.js');
	api.addFiles('lib/callbacks.js');
	api.addFiles('lib/fileUploadRestrictions.js');
	api.addFiles('lib/getAvatarColor.js');
	api.addFiles('lib/getDefaultSubscriptionPref.js');
	api.addFiles('lib/getValidRoomName.js');
	api.addFiles('lib/placeholders.js');
	api.addFiles('lib/promises.js');
	api.addFiles('lib/RoomTypesCommon.js');
	api.addFiles('lib/slashCommand.js');
	api.addFiles('lib/Message.js');
	api.addFiles('lib/MessageProperties.js');
	api.addFiles('lib/messageBox.js');
	api.addFiles('lib/MessageTypes.js');
	api.addFiles('lib/templateVarHandler.js');
	api.addFiles('lib/info.js');
	api.addFiles('lib/authorization.js');

	api.addFiles('lib/getUserNotificationPreference.js');
	api.addFiles('lib/getUserPreference.js');
	api.addFiles('lib/emoji.js');

	api.addFiles('server/lib/bugsnag.js', 'server');
	api.addFiles('server/lib/metrics_import.js', 'server');

	api.addFiles('server/lib/RateLimiter.js', 'server');

	// SERVER FUNCTIONS
	api.addFiles('server/functions/isDocker.js', 'server');
	api.addFiles('server/functions/isTheLastMessage.js', 'server');
	api.addFiles('server/functions/addUserToDefaultChannels.js', 'server');
	api.addFiles('server/functions/addUserToRoom.js', 'server');
	api.addFiles('server/functions/archiveRoom.js', 'server');
	api.addFiles('server/functions/checkUsernameAvailability.js', 'server');
	api.addFiles('server/functions/checkEmailAvailability.js', 'server');
	api.addFiles('server/functions/composeMessageObjectWithUser.js', 'server');
	api.addFiles('server/functions/createRoom.js', 'server');
	api.addFiles('server/functions/cleanRoomHistory.js', 'server');
	api.addFiles('server/functions/deleteMessage.js', 'server');
	api.addFiles('server/functions/deleteUser.js', 'server');
	api.addFiles('server/functions/getFullUserData.js', 'server');
	api.addFiles('server/functions/getRoomByNameOrIdWithOptionToJoin.js', 'server');
	api.addFiles('server/functions/loadMessageHistory.js', 'server');
	api.addFiles('server/functions/removeUserFromRoom.js', 'server');
	api.addFiles('server/functions/saveUser.js', 'server');
	api.addFiles('server/functions/saveCustomFields.js', 'server');
	api.addFiles('server/functions/saveCustomFieldsWithoutValidation.js', 'server');
	api.addFiles('server/functions/sendMessage.js', 'server');
	api.addFiles('server/functions/insertMessage.js', 'server');
	api.addFiles('server/functions/settings.js', 'server');
	api.addFiles('server/functions/setUserAvatar.js', 'server');
	api.addFiles('server/functions/setUsername.js', 'server');
	api.addFiles('server/functions/setRealName.js', 'server');
	api.addFiles('server/functions/setEmail.js', 'server');
	api.addFiles('server/functions/unarchiveRoom.js', 'server');
	api.addFiles('server/functions/updateMessage.js', 'server');
	api.addFiles('server/functions/validateCustomFields.js', 'server');
	api.addFiles('server/functions/Notifications.js', 'server');
	api.addFiles('server/functions/authorization.js', 'server');

	// SERVER LIB
	api.addFiles('server/lib/configLogger.js', 'server');
	api.addFiles('server/lib/PushNotification.js', 'server');
	api.addFiles('server/lib/defaultBlockedDomainsList.js', 'server');
	api.addFiles('server/lib/interceptDirectReplyEmails.js', 'server');
	api.addFiles('server/lib/loginErrorMessageOverride.js', 'server');
	api.addFiles('server/lib/notifyUsersOnMessage.js', 'server');
	api.addFiles('server/lib/processDirectEmail.js', 'server');
	api.addFiles('server/lib/roomTypes.js', 'server');
	api.addFiles('server/lib/sendNotificationsOnMessage.js', 'server');
	api.addFiles('server/lib/validateEmailDomain.js', 'server');
	api.addFiles('server/lib/passwordPolicy.js', 'server');
	api.addFiles('server/lib/migrations.js', 'server');

	// SERVER MODELS
	api.addFiles('server/models/index.js', 'server');
	api.addFiles('server/models/Permissions.js', 'server');
	api.addFiles('server/models/Roles.js', 'server');

	api.addFiles('server/oauth/oauth.js', 'server');
	api.addFiles('server/oauth/facebook.js', 'server');
	api.addFiles('server/oauth/twitter.js', 'server');
	api.addFiles('server/oauth/google.js', 'server');
	api.addFiles('server/oauth/proxy.js', 'server');

	api.addFiles('server/startup/statsTracker_import.js', 'server');
	api.addFiles('server/startup/robots.js', 'server');

	// SERVER PUBLICATIONS
	api.addFiles('server/publications/settings.js', 'server');

	// SERVER METHODS
	api.addFiles('server/methods/addOAuthService.js', 'server');
	api.addFiles('server/methods/refreshOAuthService.js', 'server');
	api.addFiles('server/methods/addUserToRoom.js', 'server');
	api.addFiles('server/methods/addUsersToRoom.js', 'server');
	api.addFiles('server/methods/archiveRoom.js', 'server');
	api.addFiles('server/methods/blockUser.js', 'server');
	api.addFiles('server/methods/checkRegistrationSecretURL.js', 'server');
	api.addFiles('server/methods/checkUsernameAvailability.js', 'server');
	api.addFiles('server/methods/cleanRoomHistory.js', 'server');
	api.addFiles('server/methods/createChannel.js', 'server');
	api.addFiles('server/methods/createToken.js', 'server');
	api.addFiles('server/methods/createPrivateGroup.js', 'server');
	api.addFiles('server/methods/deleteMessage.js', 'server');
	api.addFiles('server/methods/deleteUserOwnAccount.js', 'server');
	api.addFiles('server/methods/executeSlashCommandPreview.js', 'server');
	api.addFiles('server/methods/filterBadWords.js', ['server']);
	api.addFiles('server/methods/filterATAllTag.js', 'server');
	api.addFiles('server/methods/filterATHereTag.js', 'server');
	api.addFiles('server/methods/getChannelHistory.js', 'server');
	api.addFiles('server/methods/getFullUserData.js', 'server');
	api.addFiles('server/methods/getRoomJoinCode.js', 'server');
	api.addFiles('server/methods/getRoomRoles.js', 'server');
	api.addFiles('server/methods/getServerInfo.js', 'server');
	api.addFiles('server/methods/getSingleMessage.js', 'server');
	api.addFiles('server/methods/getSlashCommandPreviews.js', 'server');
	api.addFiles('server/methods/getUserRoles.js', 'server');
	api.addFiles('server/methods/insertOrUpdateUser.js', 'server');
	api.addFiles('server/methods/joinDefaultChannels.js', 'server');
	api.addFiles('server/methods/joinRoom.js', 'server');
	api.addFiles('server/methods/leaveRoom.js', 'server');
	api.addFiles('server/methods/removeOAuthService.js', 'server');
	api.addFiles('server/methods/restartServer.js', 'server');
	api.addFiles('server/methods/robotMethods.js', 'server');
	api.addFiles('server/methods/saveSetting.js', 'server');
	api.addFiles('server/methods/saveSettings.js', 'server');
	api.addFiles('server/methods/sendInvitationEmail.js', 'server');
	api.addFiles('server/methods/sendMessage.js', 'server');
	api.addFiles('server/methods/sendSMTPTestEmail.js', 'server');
	api.addFiles('server/methods/setAdminStatus.js', 'server');
	api.addFiles('server/methods/setRealName.js', 'server');
	api.addFiles('server/methods/setUsername.js', 'server');
	api.addFiles('server/methods/setEmail.js', 'server');
	api.addFiles('server/methods/unarchiveRoom.js', 'server');
	api.addFiles('server/methods/unblockUser.js', 'server');
	api.addFiles('server/methods/updateMessage.js', 'server');

	// SERVER STARTUP
	api.addFiles('server/startup/settingsOnLoadCdnPrefix.js', 'server');
	api.addFiles('server/startup/settingsOnLoadDirectReply.js', 'server');
	api.addFiles('server/startup/settingsOnLoadSMTP.js', 'server');
	api.addFiles('server/startup/oAuthServicesUpdate.js', 'server');
	api.addFiles('server/startup/settings.js', 'server');

	// COMMON STARTUP
	api.addFiles('lib/startup/settingsOnLoadSiteUrl.js');

	// CLIENT LIB
	api.addFiles('client/Notifications.js', 'client');
	api.addFiles('client/OAuthProxy.js', 'client');
	api.addFiles('client/UserDeleted.js', 'client');
	api.addFiles('client/lib/RestApiClient.js', 'client');
	api.addFiles('client/lib/TabBar.js', 'client');
	api.addFiles('client/lib/RocketChatTabBar.js', 'client');
	api.addFiles('client/lib/RocketChatAnnouncement.js', 'client');
	api.addFiles('client/lib/cachedCollection.js', 'client');
	api.addFiles('client/lib/openRoom.js', 'client');
	api.addFiles('client/lib/roomExit.js', 'client');
	api.addFiles('client/lib/settings.js', 'client');
	api.addFiles('client/lib/roomTypes.js', 'client');
	api.addFiles('client/lib/userRoles.js', 'client');
	api.addFiles('client/lib/Layout.js', 'client');
	api.addFiles('client/lib/handleError.js', 'client');
	api.addFiles('client/lib/authorization.js', 'client');
	api.addFiles('client/lib/tooltip.js', 'client');
	api.addFiles('client/lib/EmojiPicker.js', 'client');
	api.addFiles('client/lib/ui-buttons.js', 'client');

	// CLIENT LIB STARTUP
	api.addFiles('client/lib/startup/commands.js', 'client');

	// CLIENT METHODS
	api.addFiles('client/methods/sendMessage.js', 'client');
	api.addFiles('client/AdminBox.js', 'client');
	api.addFiles('client/MessageAction.js', 'client');

	api.addFiles('client/defaultTabBars.js', 'client');
	api.addFiles('client/CustomTranslations.js', 'client');

	// CLIENT MODELS
	api.addFiles('client/models/index.js', 'client');
	api.addFiles('client/models/ChatPermissions.js', 'client');
	api.addFiles('client/models/Messages.js', 'client');
	api.addFiles('client/models/Roles.js', 'client');
	api.addFiles('client/models/Rooms.js', 'client');
	api.addFiles('client/models/Subscriptions.js', 'client');
	api.addFiles('client/models/Users.js', 'client');

	// CLIENT VIEWS
	api.addFiles('client/views/customFieldsForm.html', 'client');
	api.addFiles('client/views/customFieldsForm.js', 'client');

	api.addFiles('startup/defaultRoomTypes.js');
	api.addFiles('startup/index.js', 'server');

	api.addFiles('server/startup/rateLimiter.js', 'server');

	// EXPORT
	api.export('RocketChat');
	api.export('handleError', 'client');
	api.export('openRoom', 'client');

	// exports
	api.mainModule('server/lib/index.js', 'server');
	api.mainModule('client/lib/index.js', 'client');

	api.imply('tap:i18n');
});
