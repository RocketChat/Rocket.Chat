Package.describe({
	name: 'rocketchat:tokenly',
	version: '0.0.1',
	summary: 'RocketChat settings for Tokenly OAuth flow'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use('ecmascript');
	api.use('accounts-base');
	api.use('rocketchat:lib');
	api.use('service-configuration');
	api.use('rocketchat:custom-oauth');
	api.use('rocketchat:authorization');
	api.use('templating', 'client');

	api.addFiles('common.js');

	api.addFiles('login-button.css', 'client');

	api.addFiles('client/roomType.js', 'client');
	api.addFiles('client/tokenChannelsList.html', 'client');
	api.addFiles('client/tokenChannelsList.js', 'client');

	api.addFiles('startup.js', 'server');

	api.addFiles('server/functions/getProtectedTokenpassBalances.js', 'server');
	api.addFiles('server/functions/getPublicTokenpassBalances.js', 'server');
	api.addFiles('server/functions/saveRoomTokens.js', 'server');
	api.addFiles('server/functions/saveRoomTokensMinimumBalance.js', 'server');
	api.addFiles('server/functions/updateUserTokenlyBalances.js', 'server');

	api.addFiles('server/models/indexes.js', 'server');
	api.addFiles('server/models/Rooms.js', 'server');
	api.addFiles('server/models/Users.js', 'server');

	api.addFiles('server/methods/findTokenChannels.js', 'server');
});

