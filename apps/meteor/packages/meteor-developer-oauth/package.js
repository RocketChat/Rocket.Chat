Package.describe({
	summary: 'Meteor developer accounts OAuth flow',
	version: '1.3.3',
});

Package.onUse((api) => {
	api.use(['ecmascript', 'typescript']);
	api.use('service-configuration', 'server');
	api.use('oauth2', 'server');
	api.use('oauth', 'server');

	api.addFiles('meteor_developer_server.ts', 'server');

	api.export('MeteorDeveloperAccounts');
});
