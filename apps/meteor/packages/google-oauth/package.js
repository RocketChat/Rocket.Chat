Package.describe({
	summary: 'Google OAuth flow',
	version: '1.4.5',
});

Package.onUse((api) => {
	api.use(['ecmascript', 'typescript']);
	api.use('oauth2', 'server');
	api.use('oauth', 'server');
	api.use('service-configuration', 'server');

	api.addFiles('google_server.ts', 'server');

	api.export('Google');
});
