Package.describe({
	name: 'rocketchat:logger',
	version: '0.0.1',
	summary: 'Logger for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use('mongo');
	api.use('ecmascript');
	api.use('random');
	api.use('logging');
	api.use('nooitaf:colors');
	api.use('raix:eventemitter');
	api.use('templating', 'client');
	api.use('kadira:flow-router', 'client');

	api.addFiles('client/ansispan.js', 'client');
	api.addFiles('client/logger.js', 'client');
	api.addFiles('client/viewLogs.js', 'client');
	api.addFiles('client/views/viewLogs.html', 'client');
	api.addFiles('client/views/viewLogs.js', 'client');

	api.addFiles('server/server.js', 'server');

	api.export('Logger');
	api.export('SystemLogger');
	api.export('LoggerManager');
});
