Package.describe({
	name: 'rocketchat:oauth2-server-config',
	summary: 'Configure the OAuth2 Server',
	version: '1.0.0'
});

Package.onUse(function(api) {
	api.use('webapp');
	api.use('mongo');
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('rocketchat:api');
	api.use('rocketchat:theme');
	api.use('rocketchat:oauth2-server');

	api.use('templating', 'client');
	api.use('kadira:flow-router', 'client');

	//// General //
	// Server
	api.addFiles('server/models/OAuthApps.js', 'server');

	//// OAuth //
	// Server
	api.addFiles('oauth/server/oauth2-server.js', 'server');
	api.addFiles('oauth/server/default-services.js', 'server');

	api.addFiles('oauth/client/stylesheets/oauth2.css', 'client');

	// Client
	api.addFiles('oauth/client/oauth2-client.html', 'client');
	api.addFiles('oauth/client/oauth2-client.js', 'client');


	//// Admin //
	// Client
	api.addFiles('admin/client/startup.js', 'client');
	api.addFiles('admin/client/collection.js', 'client');
	api.addFiles('admin/client/route.js', 'client');
	api.addFiles('admin/client/views/oauthApp.html', 'client');
	api.addFiles('admin/client/views/oauthApp.js', 'client');
	api.addFiles('admin/client/views/oauthApps.html', 'client');
	api.addFiles('admin/client/views/oauthApps.js', 'client');

	// Server
	api.addFiles('admin/server/publications/oauthApps.js', 'server');
	api.addFiles('admin/server/methods/addOAuthApp.js', 'server');
	api.addFiles('admin/server/methods/updateOAuthApp.js', 'server');
	api.addFiles('admin/server/methods/deleteOAuthApp.js', 'server');
});
