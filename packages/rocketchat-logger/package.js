Package.describe({
	name: 'rocketchat:logger',
	version: '0.0.1',
	summary: 'Logger for Rocket.Chat',
	debugOnly: true
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('coffeescript');
	api.use('underscore');
	api.use('logging');
	api.use('nooitaf:colors');
	api.use('raix:eventemitter');
	api.use('templating', 'client', {weak: true});

	api.addFiles('ansispan.js', 'client');
	api.addFiles('logger.coffee', 'client');
	api.addFiles('server.coffee', 'server');

	api.export('Logger');
});
