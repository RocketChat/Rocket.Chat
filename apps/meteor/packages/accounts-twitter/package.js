Package.describe({
	summary: 'Login service for Twitter accounts',
	version: '1.5.2',
});

Package.onUse((api) => {
	api.use(['ecmascript', 'typescript']);
	api.use('accounts-base', 'server');
	// Export Accounts (etc) to packages using this one.
	api.imply('accounts-base', 'server');
	api.use('accounts-oauth', 'server');
	api.use('twitter-oauth');
	api.imply('twitter-oauth');

	api.addFiles('twitter.ts', 'server');
});
