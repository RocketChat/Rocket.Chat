Package.describe({
	name: 'rocketchat:api',
	version: '0.0.1',
	summary: 'Rest API',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'nimble:restivus'
	]);

	api.addFiles('server/api.js', 'server');
	api.addFiles('server/settings.js', 'server');

	//Register helpers
	api.addFiles('server/helpers/requestParams.js', 'server');
	api.addFiles('server/helpers/getPaginationItems.js', 'server');
	api.addFiles('server/helpers/getUserFromParams.js', 'server');
	api.addFiles('server/helpers/isUserFromParams.js', 'server');
	api.addFiles('server/helpers/parseJsonQuery.js', 'server');
	api.addFiles('server/helpers/deprecationWarning.js', 'server');
	api.addFiles('server/helpers/getLoggedInUser.js', 'server');

	//Add default routes
	api.addFiles('server/default/info.js', 'server');
	api.addFiles('server/default/metrics.js', 'server');

	//Add v1 routes
	api.addFiles('server/v1/channels.js', 'server');
	api.addFiles('server/v1/rooms.js', 'server');
	api.addFiles('server/v1/subscriptions.js', 'server');
	api.addFiles('server/v1/chat.js', 'server');
	api.addFiles('server/v1/commands.js', 'server');
	api.addFiles('server/v1/emoji-custom.js', 'server');
	api.addFiles('server/v1/groups.js', 'server');
	api.addFiles('server/v1/im.js', 'server');
	api.addFiles('server/v1/integrations.js', 'server');
	api.addFiles('server/v1/misc.js', 'server');
	api.addFiles('server/v1/permissions.js', 'server');
	api.addFiles('server/v1/push.js', 'server');
	api.addFiles('server/v1/settings.js', 'server');
	api.addFiles('server/v1/stats.js', 'server');
	api.addFiles('server/v1/users.js', 'server');
	api.addFiles('server/v1/spotlight.js', 'server');
});
