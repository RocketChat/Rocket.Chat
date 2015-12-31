Package.describe({
	name: 'rocketchat:oauth2-server-config',
	summary: "Configure the OAuth2 Server",
	version: "1.0.0"
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('webapp');
	api.use('coffeescript');
	api.use('rocketchat:oauth2-server');

	api.use('templating', 'client');
	api.use('kadira:flow-router', 'client');

	api.addFiles('server/oauth2-server.coffee', 'server');

	api.addFiles('client/oauth2-client.html', 'client');
	api.addFiles('client/oauth2-client.coffee', 'client');
});
