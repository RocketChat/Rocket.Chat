Package.describe({
	name: 'rocketchat:bot-manager',
	version: '0.0.1',
	summary: 'Package to monitor and manage bot accounts',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('mongo');
	api.use('ecmascript');
	api.use('templating');
	api.use('babel-compiler');
	api.use('rocketchat:lib');
	api.use('rocketchat:authorization');
	api.use('rocketchat:api');
	api.use('rocketchat:theme');
	api.use('rocketchat:logger');
	api.use('kadira:flow-router', 'client');

	api.addFiles('client/startup.js', 'client');
	api.addFiles('client/route.js', 'client');

	api.addFiles('client/stylesheets/bots.css', 'client');

	api.addFiles('client/views/adminBots.html', 'client');
	api.addFiles('client/views/adminBots.js', 'client');
	api.addFiles('client/views/adminBotInfo.html', 'client');
	api.addFiles('client/views/adminBotInfo.js', 'client');
	api.addFiles('client/views/adminBotCreate.html', 'client');
	api.addFiles('client/views/adminBotCreate.js', 'client');
	api.addFiles('client/views/adminBotDetails.html', 'client');
	api.addFiles('client/views/adminBotDetails.js', 'client');

	api.addFiles('server/functions/saveBot.js', 'server');

	api.addFiles('server/methods/deleteBot.js', 'server');
	api.addFiles('server/methods/getBotStatistics.js', 'server');
	api.addFiles('server/methods/insertOrUpdateBot.js', 'server');
	api.addFiles('server/methods/pauseBot.js', 'server');
	api.addFiles('server/methods/pingBot.js', 'server');
	api.addFiles('server/methods/resumeBot.js', 'server');
	api.addFiles('server/methods/turnUserIntoBot.js', 'server');
	api.addFiles('server/methods/turnBotIntoUser.js', 'server');

	api.addFiles('server/startup.js', 'server');
});
