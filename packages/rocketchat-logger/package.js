Package.describe({
	name: 'rocketchat:logger',
	version: '0.0.1',
	summary: 'Logger for Rocket.Chat',
	debugOnly: true
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('coffeescript', 'client');
	api.use('templating', 'client', {weak: true});

	api.addFiles('logger.coffee', 'client');
});
