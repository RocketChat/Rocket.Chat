Package.describe({
	name: 'rocketchat:bot-manager-ui',
	version: '0.0.1',
	summary: 'AdminBox with options to monitor and manage bots',
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

	api.addFiles('client/views/adminBots.html', 'client');
	api.addFiles('client/views/adminBots.js', 'client');
	api.addFiles('client/views/adminBotInfo.html', 'client');
	api.addFiles('client/views/adminBotInfo.js', 'client');
	api.addFiles('client/views/adminBotCreate.html', 'client');
	api.addFiles('client/views/adminBotCreate.js', 'client');
	api.addFiles('client/views/adminBotDetails.html', 'client');
	api.addFiles('client/views/adminBotDetails.js', 'client');


	api.addFiles('server/startup.js', 'server');
});
