Package.describe({
	name: 'rocketchat:oauth2-server-config',
	summary: 'Configure the OAuth2 Server',
	version: '1.0.0'
});

Package.onUse(function(api) {
	api.use('webapp');
	api.use('coffeescript');
	api.use('mongo');
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('rocketchat:api');
	api.use('rocketchat:theme');
	api.use('rocketchat:oauth2-server');
	api.use('less');

	api.use('templating', 'client');
	api.use('kadira:flow-router', 'client');

	//// General //
	// Server
	api.addFiles('server/models/OAuthApps.coffee', 'server');

	//// OAuth //
	// Server
	api.addFiles('oauth/server/oauth2-server.coffee', 'server');
	api.addFiles('oauth/server/default-services.coffee', 'server');

	api.addFiles('oauth/client/stylesheets/oauth2.less', 'client');

	// Client
	api.addFiles('oauth/client/oauth2-client.html', 'client');
	api.addFiles('oauth/client/oauth2-client.coffee', 'client');


	//// Admin //
	// Client
	api.addFiles('admin/client/startup.coffee', 'client');
	api.addFiles('admin/client/collection.coffee', 'client');
	api.addFiles('admin/client/route.coffee', 'client');
	api.addFiles('admin/client/views/oauthApp.html', 'client');
	api.addFiles('admin/client/views/oauthApp.coffee', 'client');
	api.addFiles('admin/client/views/oauthApps.html', 'client');
	api.addFiles('admin/client/views/oauthApps.coffee', 'client');

	// Server
	api.addFiles('admin/server/publications/oauthApps.coffee', 'server');
	api.addFiles('admin/server/methods/addOAuthApp.coffee', 'server');
	api.addFiles('admin/server/methods/updateOAuthApp.coffee', 'server');
	api.addFiles('admin/server/methods/deleteOAuthApp.coffee', 'server');
});
