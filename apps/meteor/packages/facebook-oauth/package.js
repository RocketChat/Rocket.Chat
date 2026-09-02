Package.describe({
	summary: 'Facebook OAuth flow',
	version: '1.11.6',
});

Package.onUse((api) => {
	api.use(['ecmascript', 'typescript']);
	api.use('oauth2', 'server');
	api.use('oauth', 'server');
	api.use('service-configuration', 'server');

	api.addFiles('facebook_server.ts', 'server');

	api.export('Facebook');
});
