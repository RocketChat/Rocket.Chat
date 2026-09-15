Package.describe({
	summary: 'Twitter OAuth flow',
	version: '1.3.4',
});

Package.onUse((api) => {
	api.use(['ecmascript', 'typescript']);
	api.use('oauth1', 'server');
	api.use('oauth', 'server');
	api.use('service-configuration', 'server');

	api.addFiles('twitter_server.ts', 'server');

	api.export('Twitter');
});
